import React from 'react';

export default function GameOverScreen({ finalLeaderboard, socketId, playerName, onPlayAgain }) {
  const playerEntry = finalLeaderboard?.find(p => p.socketId === socketId);
  const playerRank = playerEntry ? finalLeaderboard.indexOf(playerEntry) + 1 : '-';
  const playerScore = playerEntry ? playerEntry.score : 0;
  const isTopThree = playerRank <= 3 && playerRank !== '-';

  const podium = {
    1: { border: '#FFD700', emoji: '🥇' },
    2: { border: '#C0C0C0', emoji: '🥈' },
    3: { border: '#CD7F32', emoji: '🥉' }
  };

  const myPodium = podium[playerRank];

  return (
    <div className="screen bg-black" style={{ paddingBottom: 40 }}>

      <div className="animate-fade-in-up">
        {isTopThree ? (
          <div className="podium-circle" style={{ borderColor: myPodium.border }}>
            {myPodium.emoji}
          </div>
        ) : (
          <div className="podium-circle" style={{ borderColor: 'var(--border)' }}>
            <span style={{ fontSize: 40, fontWeight: 900, color: 'var(--text-muted)' }}>#{playerRank}</span>
          </div>
        )}
      </div>

      <h1 className="title-large animate-fade-in-up" style={{ color: isTopThree ? 'var(--gold)' : 'white', marginBottom: 8, animationDelay: '0.1s', animationFillMode: 'both' }}>
        {isTopThree ? 'Excellent Work!' : 'Quiz Complete'}
      </h1>
      
      <p className="subtitle animate-fade-in-up" style={{ color: 'var(--text-muted)', marginBottom: 32, animationDelay: '0.2s', animationFillMode: 'both' }}>
        {playerRank === 1 ? 'Outstanding performance! 🌟' : 
         playerRank <= 3 ? 'Great job, you are in the top 3! 🌟' : 
         'Great effort! Keep practicing! 💪'}
      </p>

      <div className="final-score-card animate-fade-in-up" style={{ animationDelay: '0.3s', animationFillMode: 'both' }}>
        <p className="input-label">FINAL RANK</p>
        <div className="final-rank-val">#{playerRank}</div>
        <div className="final-score-val">{playerScore} pts</div>
      </div>

      <div className="leaderboard-container animate-fade-in-up" style={{ flex: 1, maxHeight: 300, overflowY: 'auto', marginBottom: 24, animationDelay: '0.4s', animationFillMode: 'both' }}>
        <p className="input-label" style={{ position: 'sticky', top: -16, background: 'var(--bg-surface)', padding: '16px 0 8px 0', zIndex: 1 }}>Final Standings</p>
        {finalLeaderboard?.slice(0, 5).map((player, idx) => {
          const isMe = player.socketId === socketId;
          const rank = idx + 1;
          const borderLeft = podium[rank] ? `4px solid ${podium[rank].border}` : '4px solid transparent';
          
          return (
            <div key={idx} className={`leaderboard-row ${isMe ? 'highlight' : ''}`} style={{ borderLeft }}>
              <div className="leaderboard-rank">#{rank}</div>
              <div className="leaderboard-name">{player.playerName} {isMe && '(You)'}</div>
              <div className="leaderboard-score">{player.score} pts</div>
            </div>
          );
        })}
      </div>

      <div className="animate-fade-in-up" style={{ width: '100%', maxWidth: 400, animationDelay: '0.5s', animationFillMode: 'both' }}>
        <button className="btn-primary" onClick={onPlayAgain}>
          Done
        </button>
      </div>
    </div>
  );
}
