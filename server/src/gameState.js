// In-memory game state manager using Maps for O(1) lookups

const { v4: uuidv4 } = require('uuid');

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
 * @returns {string} The generated room code
 */
function createRoom(hostSocketId, questions) {
  const code = generateRoomCode();

  const room = {
    code,
    hostSocketId,
    players: new Map(),
    questions: questions || [],
    currentQuestionIndex: 0,
    status: 'lobby', // 'lobby' | 'playing' | 'finished'
    scores: new Map(),
    answeredSet: new Set(),
    questionStartTime: null,
  };

  rooms.set(code, room);
  return code;
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
 * Deletes a room from the Map.
 * @param {string} code
 */
function removeRoom(code) {
  rooms.delete(code);
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

module.exports = {
  createRoom,
  getRoom,
  addPlayer,
  removePlayer,
  removeRoom,
  findRoomBySocket,
};
