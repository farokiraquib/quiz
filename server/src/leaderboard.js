// Score calculation and leaderboard builder

/**
 * Calculates score for a single answer submission.
 * If correct: base 1000 scaled by speed, clamped to minimum 100.
 * If wrong: 0.
 *
 * @param {boolean} isCorrect - Whether the answer was correct
 * @param {number} timeTakenMs - Time taken to answer in milliseconds
 * @param {number} maxTimeMs - Maximum allowed time in milliseconds
 * @returns {number} The calculated score
 */
function calculateScore(isCorrect, timeTakenMs, maxTimeMs) {
  if (!isCorrect) return 0;

  // Clamp timeTaken to [0, maxTimeMs] to handle edge cases
  const clampedTime = Math.max(0, Math.min(timeTakenMs, maxTimeMs));
  const rawScore = Math.round(1000 * (1 - clampedTime / maxTimeMs));
  return Math.max(100, rawScore);
}

/**
 * Builds a sorted leaderboard from the room's scores Map.
 * This is the ONLY place sorting happens in the entire server.
 *
 * @param {object} room - A RoomState object
 * @returns {Array<{socketId: string, name: string, score: number, rank: number}>}
 */
function buildLeaderboard(room) {
  const entries = [];

  for (const [socketId, score] of room.scores) {
    const player = room.players.get(socketId);
    if (player) {
      entries.push({
        socketId,
        name: player.name,
        score,
      });
    }
  }

  // Sort descending by score
  entries.sort((a, b) => b.score - a.score);

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
