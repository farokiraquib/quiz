// Score calculation and leaderboard builder (Redis-backed)

const { getRedisClient } = require('./redis');
const { getAllPlayers } = require('./gameState');

/**
 * Calculates score for a single answer submission.
 * Based 50% on accuracy and 50% on speed. Max score 1000.
 *
 * @param {number} accuracy - A float between 0 and 1 representing answer correctness
 * @param {number} timeTakenMs - Time taken to answer in milliseconds
 * @param {number} maxTimeMs - Maximum allowed time in milliseconds
 * @returns {number} The calculated score
 */
function calculateScore(accuracy, timeTakenMs, maxTimeMs) {
  if (accuracy <= 0) return 0;

  // Clamp timeTaken to [0, maxTimeMs] to handle edge cases
  const clampedTime = Math.max(0, Math.min(timeTakenMs, maxTimeMs));
  const timeBonus = 1 - (clampedTime / maxTimeMs);
  
  // 500 max for accuracy, 500 max for speed (scaled by accuracy)
  const score = (500 * accuracy) + (500 * accuracy * timeBonus);
  return Math.round(score);
}

/**
 * Builds a sorted leaderboard by fetching the Sorted Set from Redis.
 *
 * @param {string} roomCode - The room code
 * @returns {Promise<Array<{socketId: string, name: string, score: number, rank: number}>>}
 */
async function buildLeaderboard(roomCode) {
  const redis = await getRedisClient();
  const entries = [];

  // ZREVRANGE: get members sorted by score descending, with scores
  const results = await redis.zRangeWithScores(`room:${roomCode}:scores`, 0, -1, { REV: true });
  
  if (!results || results.length === 0) return [];

  // Get player names
  const playersMap = await getAllPlayers(roomCode);

  for (const { value: socketId, score } of results) {
    const player = playersMap.get(socketId);
    if (player) {
      entries.push({
        socketId,
        name: player.name,
        score,
      });
    }
  }

  // Assign ranks (1-indexed, ties get the same rank)
  let currentRank = 1;
  for (let i = 0; i < entries.length; i++) {
    if (i > 0 && entries[i].score < entries[i - 1].score) {
      currentRank = i + 1;
    }
    entries[i].rank = currentRank;
  }

  return entries;
}

module.exports = {
  calculateScore,
  buildLeaderboard,
};
