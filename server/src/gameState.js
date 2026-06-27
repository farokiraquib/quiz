// In-memory game state manager using Maps for O(1) lookups

const { v4: uuidv4 } = require('uuid');
const cloudinary = require('cloudinary').v2;

/** @type {Map<string, RoomState>} */
const rooms = new Map();


/**
 * Generates a unique 6-digit room code, checking for collisions.
 * @returns {string}
 */
function generateRoomCode() {
  let code;
  do {
    code = String(Math.floor(100000 + Math.random() * 900000));
  } while (rooms.has(code));
  return code;
}

/**
 * Creates a new room and stores it in the rooms Map.
 * @param {string} hostSocketId - The socket ID of the host
 * @param {Array<{text: string, options: string[], correctIndex: number, timeLimit: number}>} questions
 * @param {string} [customRoomCode] - Optional custom room code
 * @param {string} [password] - Optional password for the room
 * @returns {object} The generated room code and host secret
 */
function createRoom(hostSocketId, questions, customRoomCode, password) {
  let code = customRoomCode;
  if (!code || rooms.has(code)) {
    code = generateRoomCode();
  }

  const hostSecret = uuidv4();

  const room = {
    code,
    hostSocketId,
    hostSecret,
    password: password || '',
    players: new Map(),
    questions: questions || [],
    currentQuestionIndex: 0,
    status: 'lobby', // 'lobby' | 'playing' | 'finished'
    scores: new Map(),
    answeredSet: new Set(),
    questionStartTime: null,
  };

  rooms.set(code, room);
  return { code, hostSecret };
}

/**
 * Returns a RoomState by code, or null if not found.
 * @param {string} code
 * @returns {object|null}
 */
function getRoom(code) {
  return rooms.get(code) || null;
}

/**
 * Adds a player to a room's players Map and initializes their score to 0.
 * @param {string} code - Room code
 * @param {string} socketId - Player's socket ID
 * @param {string} name - Player's display name
 * @returns {object} The player object
 */
function addPlayer(code, socketId, name) {
  const room = rooms.get(code);
  if (!room) return null;

  const player = {
    id: socketId,
    name,
    socketId,
  };

  room.players.set(socketId, player);
  room.scores.set(socketId, 0);
  return player;
}

/**
 * Removes a player from whatever room they are in.
 * @param {string} socketId
 * @returns {{ room: object, playerName: string }|null}
 */
function removePlayer(socketId) {
  for (const [code, room] of rooms) {
    if (room.players.has(socketId)) {
      const player = room.players.get(socketId);
      room.players.delete(socketId);
      room.scores.delete(socketId);
      room.answeredSet.delete(socketId);
      return { room, playerName: player.name };
    }
  }
  return null;
}

/**
 * Deletes a room from the Map and cleans up associated Cloudinary images.
 * @param {string} code
 */
async function removeRoom(code) {
  const room = rooms.get(code);
  if (!room) return;

  // Find all Cloudinary public_ids in questions
  const publicIds = [];
  room.questions.forEach(q => {
    if (q.imageId) publicIds.push(q.imageId);
    if (q.options) {
      q.options.forEach(opt => {
        if (opt && opt.imageId) publicIds.push(opt.imageId);
      });
    }
  });

  rooms.delete(code);

  if (publicIds.length > 0) {
    try {
      // Configure cloudinary with env vars if not done globally
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
 * @returns {string|null} Room code or null
 */
function findRoomBySocket(socketId) {
  for (const [code, room] of rooms) {
    if (room.hostSocketId === socketId) return code;
    if (room.players.has(socketId)) return code;
  }
  return null;
}

/**
 * Returns a list of all active rooms (basic info)
 * @returns {Array<{code: string, playerCount: number, status: string}>}
 */
function getActiveRooms() {
  const activeRooms = [];
  for (const [code, room] of rooms) {
    activeRooms.push({
      code,
      playerCount: room.players.size,
      status: room.status,
    });
  }
  return activeRooms;
}

module.exports = {
  createRoom,
  getRoom,
  addPlayer,
  removePlayer,
  removeRoom,
  findRoomBySocket,
  getActiveRooms,
};
