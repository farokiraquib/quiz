// Score calculation and leaderboard builder

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
