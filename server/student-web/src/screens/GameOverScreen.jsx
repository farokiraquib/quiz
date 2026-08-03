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
    <div className="screen" style={{ paddingBottom: 40 }}>
      <div className="bg-orb gameover-orb"></div>

      <div style={{ animation: 'popIn 0.8s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards' }}>
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

      <h1 className="title-large" style={{ color: isTopThree ? 'var(--gold)' : 'white', marginBottom: 8, animation: 'fadeInUp 0.5s ease forwards' }}>
        {isTopThree ? 'Amazing!' : 'Game Over!'}
      </h1>
      
      <p className="subtitle" style={{ color: 'var(--text-muted)', marginBottom: 32 }}>
        {playerRank === 1 ? 'You are the champion! 🏆' : 
         playerRank <= 3 ? 'You made the podium! 🌟' : 
         'Great effort! Keep practicing! 💪'}
      </p>

      <div className="final-score-card" style={{ animation: 'slideUp 0.6s ease forwards' }}>
        <p className="input-label">FINAL RANK</p>
        <div className="final-rank-val">#{playerRank}</div>
        <div className="final-score-val">{playerScore} pts</div>
      </div>

      <div className="leaderboard-container" style={{ flex: 1, maxHeight: 300, overflowY: 'auto', marginBottom: 24, animation: 'fadeIn 0.8s ease forwards' }}>
        <p className="input-label" style={{ position: 'sticky', top: -16, background: 'var(--bg)', padding: '16px 0 8px 0', zIndex: 1 }}>Final Standings</p>
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

      <div style={{ width: '100%', maxWidth: 400, animation: 'fadeIn 1s ease forwards' }}>
        <button className="btn-primary" onClick={onPlayAgain}>
          Play Again
        </button>
      </div>
    </div>
  );
}
