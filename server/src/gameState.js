// Redis-backed game state manager
// All functions are async. Uses Redis Hashes, Sorted Sets, and Sets.
// Key patterns:
//   room:{code}           — Hash with room metadata
//   room:{code}:players   — Hash mapping socketId -> JSON player object
//   room:{code}:scores    — Sorted Set with socketId as member and score as value
//   room:{code}:answered  — Set of socketIds who answered the current question
//   room:{code}:questions — String containing JSON array of questions

const { v4: uuidv4 } = require('uuid');
const cloudinary = require('cloudinary').v2;
const { getRedisClient } = require('./redis');

// In-memory cache for questions to avoid expensive deserialization and latency
const questionsCache = new Map();

/**
 * Generates a unique 6-digit room code, checking for collisions in Redis.
 * @returns {Promise<string>}
 */
async function generateRoomCode() {
  const redis = await getRedisClient();
  let code;
  let exists = true;
  while (exists) {
    code = String(Math.floor(100000 + Math.random() * 900000));
    exists = await redis.exists(`room:${code}`);
  }
  return code;
}

/**
 * Creates a new room and stores it in Redis.
 * @param {string} hostSocketId - The socket ID of the host
 * @param {Array} questions
 * @param {string} [customRoomCode] - Optional custom room code
 * @param {string} [password] - Optional password for the room
 * @returns {Promise<{code: string, hostSecret: string}>}
 */
async function createRoom(hostSocketId, questions, customRoomCode, password) {
  const redis = await getRedisClient();

  let code = customRoomCode;
  if (!code || (await redis.exists(`room:${code}`))) {
    code = await generateRoomCode();
  }

  const hostSecret = uuidv4();

  // Store room metadata as a Hash
  await redis.hSet(`room:${code}`, {
    code,
    hostSocketId,
    hostSecret,
    password: password || '',
    currentQuestionIndex: '0',
    status: 'lobby',
    questionStartTime: '',
  });

  // Store questions as a JSON string
  await redis.set(`room:${code}:questions`, JSON.stringify(questions || []));

  // Set TTL on room keys (24 hours) to auto-cleanup stale rooms
  const ttl = 86400;
  await redis.expire(`room:${code}`, ttl);
  await redis.expire(`room:${code}:questions`, ttl);

  return { code, hostSecret };
}

/**
 * Returns room metadata by code, or null if not found.
 * @param {string} code
 * @returns {Promise<object|null>}
 */
async function getRoom(code) {
  const redis = await getRedisClient();
  const data = await redis.hGetAll(`room:${code}`);
  if (!data || !data.code) return null;

  return {
    code: data.code,
    hostSocketId: data.hostSocketId,
    hostSecret: data.hostSecret,
    password: data.password || '',
    currentQuestionIndex: parseInt(data.currentQuestionIndex, 10) || 0,
    status: data.status || 'lobby',
    questionStartTime: data.questionStartTime ? parseInt(data.questionStartTime, 10) : null,
  };
}

/**
 * Gets the questions for a room.
 * @param {string} code
 * @returns {Promise<Array>}
 */
async function getQuestions(code) {
  if (questionsCache.has(code)) return questionsCache.get(code);
  const redis = await getRedisClient();
  const raw = await redis.get(`room:${code}:questions`);
  const parsed = raw ? JSON.parse(raw) : [];
  questionsCache.set(code, parsed);
  return parsed;
}

/**
 * Updates a single room field in the Redis hash.
 * @param {string} code
 * @param {string} field
 * @param {string} value
 */
async function setRoomField(code, field, value) {
  const redis = await getRedisClient();
  await redis.hSet(`room:${code}`, field, String(value));
}

/**
 * Updates multiple room fields at once.
 * @param {string} code
 * @param {object} fields
 */
async function setRoomFields(code, fields) {
  const redis = await getRedisClient();
  const stringified = {};
  for (const [key, val] of Object.entries(fields)) {
    stringified[key] = String(val);
  }
  await redis.hSet(`room:${code}`, stringified);
}

/**
 * Updates the questions for a room.
 * @param {string} code
 * @param {Array} questions
 */
async function setQuestions(code, questions) {
  questionsCache.set(code, questions);
  const redis = await getRedisClient();
  await redis.set(`room:${code}:questions`, JSON.stringify(questions));
}

/**
 * Adds a player to a room's players Hash and initializes their score to 0.
 * @param {string} code - Room code
 * @param {string} socketId - Player's socket ID
 * @param {string} name - Player's display name
 * @returns {Promise<object|null>} The player object
 */
async function addPlayer(code, socketId, name) {
  const redis = await getRedisClient();
  const exists = await redis.exists(`room:${code}`);
  if (!exists) return null;

  const player = { id: socketId, name, socketId };

  // Use pipeline for atomic multi-command
  const pipeline = redis.multi();
  pipeline.hSet(`room:${code}:players`, socketId, JSON.stringify(player));
  pipeline.zAdd(`room:${code}:scores`, { score: 0, value: socketId });
  await pipeline.exec();

  // Ensure TTL is set on the new keys
  const ttl = 86400;
  await redis.expire(`room:${code}:players`, ttl);
  await redis.expire(`room:${code}:scores`, ttl);

  return player;
}

/**
 * Checks if a player is in a room.
 * @param {string} code
 * @param {string} socketId
 * @returns {Promise<boolean>}
 */
async function hasPlayer(code, socketId) {
  const redis = await getRedisClient();
  return await redis.hExists(`room:${code}:players`, socketId);
}

/**
 * Gets a player from a room.
 * @param {string} code
 * @param {string} socketId
 * @returns {Promise<object|null>}
 */
async function getPlayer(code, socketId) {
  const redis = await getRedisClient();
  const raw = await redis.hGet(`room:${code}:players`, socketId);
  return raw ? JSON.parse(raw) : null;
}

/**
 * Gets the count of players in a room.
 * @param {string} code
 * @returns {Promise<number>}
 */
async function getPlayerCount(code) {
  const redis = await getRedisClient();
  return await redis.hLen(`room:${code}:players`);
}

/**
 * Gets all players in a room.
 * @param {string} code
 * @returns {Promise<Map<string, object>>}
 */
async function getAllPlayers(code) {
  const redis = await getRedisClient();
  const raw = await redis.hGetAll(`room:${code}:players`);
  const map = new Map();
  for (const [socketId, json] of Object.entries(raw)) {
    map.set(socketId, JSON.parse(json));
  }
  return map;
}

/**
 * Removes a player from a specific room.
 * @param {string} code
 * @param {string} socketId
 * @returns {Promise<{playerName: string}|null>}
 */
async function removePlayerFromRoom(code, socketId) {
  const redis = await getRedisClient();
  const raw = await redis.hGet(`room:${code}:players`, socketId);
  if (!raw) return null;

  const player = JSON.parse(raw);

  const pipeline = redis.multi();
  pipeline.hDel(`room:${code}:players`, socketId);
  pipeline.zRem(`room:${code}:scores`, socketId);
  pipeline.sRem(`room:${code}:answered`, socketId);
  await pipeline.exec();

  return { playerName: player.name };
}

/**
 * Removes a player from whatever room they are in.
 * Scans all active rooms to find the player.
 * @param {string} socketId
 * @returns {Promise<{roomCode: string, playerName: string}|null>}
 */
async function removePlayer(socketId) {
  const redis = await getRedisClient();

  // Find rooms by scanning for room:*:players keys
  let cursor = '0';
  do {
    const result = await redis.scan(cursor, { MATCH: 'room:*:players', COUNT: 100 });
    cursor = String(result.cursor);
    for (const key of result.keys) {
      const exists = await redis.hExists(key, socketId);
      if (exists) {
        const code = key.split(':')[1]; // room:{code}:players -> code
        const removed = await removePlayerFromRoom(code, socketId);
        if (removed) {
          const playerCount = await getPlayerCount(code);
          return { roomCode: code, playerName: removed.playerName, playerCount };
        }
      }
    }
  } while (cursor !== '0');

  return null;
}

/**
 * Deletes a room from Redis and cleans up associated Cloudinary images.
 * @param {string} code
 */
async function removeRoom(code) {
  const redis = await getRedisClient();
  const questions = await getQuestions(code);

  // Find all Cloudinary public_ids in questions
  const publicIds = [];
  if (questions && Array.isArray(questions)) {
    questions.forEach(q => {
      if (q.imageId) publicIds.push(q.imageId);
      if (q.options) {
        q.options.forEach(opt => {
          if (opt && opt.imageId) publicIds.push(opt.imageId);
        });
      }
    });
  }

  // Delete all room keys
  const pipeline = redis.multi();
  pipeline.del(`room:${code}`);
  pipeline.del(`room:${code}:players`);
  pipeline.del(`room:${code}:scores`);
  pipeline.del(`room:${code}:answered`);
  pipeline.del(`room:${code}:questions`);
  await pipeline.exec();
  questionsCache.delete(code);

  // Cleanup Cloudinary images in background
  if (publicIds.length > 0) {
    try {
      await cloudinary.api.delete_resources(publicIds);
      console.log(`[Room ${code}] Deleted ${publicIds.length} images from Cloudinary.`);
    } catch (err) {
      console.error(`[Room ${code}] Failed to delete images from Cloudinary:`, err);
    }
  }
}

/**
 * Finds which room a socket belongs to (as host or player).
 * @param {string} socketId
 * @returns {Promise<string|null>} Room code or null
 */
async function findRoomBySocket(socketId) {
  const redis = await getRedisClient();

  // Scan for room:* keys (room metadata hashes, not sub-keys)
  let cursor = '0';
  do {
    const result = await redis.scan(cursor, { MATCH: 'room:*', COUNT: 100 });
    cursor = String(result.cursor);
    for (const key of result.keys) {
      // Only check top-level room hashes (room:{code} — no colons after code)
      const parts = key.split(':');
      if (parts.length !== 2) continue;

      const code = parts[1];

      // Check if this socket is the host
      const hostSocketId = await redis.hGet(key, 'hostSocketId');
      if (hostSocketId === socketId) return code;

      // Check if this socket is a player
      const isPlayer = await redis.hExists(`room:${code}:players`, socketId);
      if (isPlayer) return code;
    }
  } while (cursor !== '0');

  return null;
}

/**
 * Returns a list of all active rooms (basic info).
 * @returns {Promise<Array<{code: string, playerCount: number, status: string}>>}
 */
async function getActiveRooms() {
  const redis = await getRedisClient();
  const activeRooms = [];

  let cursor = '0';
  do {
    const result = await redis.scan(cursor, { MATCH: 'room:*', COUNT: 100 });
    cursor = String(result.cursor);
    for (const key of result.keys) {
      const parts = key.split(':');
      if (parts.length !== 2) continue;

      const code = parts[1];
      const status = await redis.hGet(key, 'status');
      const playerCount = await redis.hLen(`room:${code}:players`);

      activeRooms.push({ code, playerCount, status: status || 'lobby' });
    }
  } while (cursor !== '0');

  return activeRooms;
}

// ─── Answered Set helpers ─────────────────────────────────────────────

/**
 * Marks a player as having answered the current question.
 * @param {string} code
 * @param {string} socketId
 */
async function markAnswered(code, socketId) {
  const redis = await getRedisClient();
  const added = await redis.sAdd(`room:${code}:answered`, socketId);
  await redis.expire(`room:${code}:answered`, 86400);
  return added;
}

/**
 * Checks if a player has already answered the current question.
 * @param {string} code
 * @param {string} socketId
 * @returns {Promise<boolean>}
 */
async function hasAnswered(code, socketId) {
  const redis = await getRedisClient();
  return await redis.sIsMember(`room:${code}:answered`, socketId);
}

/**
 * Gets the count of players who answered the current question.
 * @param {string} code
 * @returns {Promise<number>}
 */
async function getAnsweredCount(code) {
  const redis = await getRedisClient();
  return await redis.sCard(`room:${code}:answered`);
}

/**
 * Clears the answered set for a room (used when starting a new question).
 * @param {string} code
 */
async function clearAnswered(code) {
  const redis = await getRedisClient();
  await redis.del(`room:${code}:answered`);
}

// ─── Score helpers ────────────────────────────────────────────────────

/**
 * Gets a player's current score.
 * @param {string} code
 * @param {string} socketId
 * @returns {Promise<number>}
 */
async function getScore(code, socketId) {
  const redis = await getRedisClient();
  const score = await redis.zScore(`room:${code}:scores`, socketId);
  return score || 0;
}

/**
 * Adds points to a player's score (increment).
 * @param {string} code
 * @param {string} socketId
 * @param {number} points
 */
async function addScore(code, socketId, points) {
  const redis = await getRedisClient();
  await redis.zIncrBy(`room:${code}:scores`, points, socketId);
}

module.exports = {
  createRoom,
  getRoom,
  getQuestions,
  setRoomField,
  setRoomFields,
  setQuestions,
  addPlayer,
  hasPlayer,
  getPlayer,
  getPlayerCount,
  getAllPlayers,
  removePlayer,
  removePlayerFromRoom,
  removeRoom,
  findRoomBySocket,
  getActiveRooms,
  markAnswered,
  hasAnswered,
  getAnsweredCount,
  clearAnswered,
  getScore,
  addScore,
};
