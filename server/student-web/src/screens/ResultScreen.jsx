import React from 'react';

export default function ResultScreen({ questionResult, selectedAnswer, socketId, question }) {
  if (!questionResult) return null;

  const { correctIndices, correctIndex, leaderboard, showLeaderboard } = questionResult;
  const actualCorrect = correctIndices || (correctIndex !== undefined ? [correctIndex] : []);
  
  const didAnswer = selectedAnswer && selectedAnswer.length > 0;
  let isCorrect = false;

  if (didAnswer) {
    if (question?.type === 'multiple') {
      isCorrect = selectedAnswer.length === actualCorrect.length && 
                  selectedAnswer.every(val => actualCorrect.includes(val));
    } else {
      isCorrect = actualCorrect.includes(selectedAnswer[0]);
    }
  }

  const playerEntry = leaderboard?.find(p => p.socketId === socketId);
  const playerRank = playerEntry ? leaderboard.indexOf(playerEntry) + 1 : '-';
  const playerScore = playerEntry ? playerEntry.score : 0;

  const getTitle = () => {
    if (!didAnswer) return "Time's Up!";
    if (isCorrect) return "Correct!";
    return "Not Quite!";
  };

  const getEmoji = () => {
    if (!didAnswer) return "⏰";
    if (isCorrect) return "🎉";
    return "😔";
  };

  const getOptionText = (idx) => {
    const opt = question?.options?.[idx];
    if (!opt) return `Option ${idx + 1}`;
    const text = typeof opt === 'object' ? opt.text : opt;
    return text || `Option ${idx + 1}`;
  };

  const correctOptionTexts = actualCorrect.map(idx => getOptionText(idx)).join(' & ');

  return (
    <div className="screen bg-black">

      <div className="result-icon-circle animate-fade-in-up">
        {getEmoji()}
      </div>

      <h1 className="title-large animate-fade-in-up" style={{ color: isCorrect ? 'var(--green)' : didAnswer ? 'var(--red)' : 'var(--yellow)', textShadow: 'none', marginBottom: 24, animationDelay: '0.1s', animationFillMode: 'both' }}>
        {getTitle()}
      </h1>

      {!isCorrect && (
        <div className="card animate-fade-in-up" style={{ padding: 16, marginBottom: 24, animationDelay: '0.2s', animationFillMode: 'both' }}>
          <p className="input-label" style={{ marginBottom: 4, color: 'var(--green)' }}>Correct Answer</p>
          <p style={{ fontWeight: 700, fontSize: 18 }}>{correctOptionTexts}</p>
        </div>
      )}

      <div className="result-stats-row animate-fade-in-up" style={{ animationDelay: '0.3s', animationFillMode: 'both' }}>
        <div className="result-stat-card">
          <div className="result-stat-label">RANK</div>
          <div className="result-stat-value">#{playerRank}</div>
        </div>
        <div className="result-stat-card">
          <div className="result-stat-label">SCORE</div>
          <div className="result-stat-value">{playerScore}</div>
        </div>
      </div>

      {showLeaderboard && (
        <div className="leaderboard-container animate-fade-in-up" style={{ animationDelay: '0.4s', animationFillMode: 'both' }}>
          <p className="input-label" style={{ marginBottom: 12 }}>Top 5 Standings</p>
          {leaderboard?.slice(0, 5).map((player, idx) => {
            const isMe = player.socketId === socketId;
            return (
              <div key={idx} className={`leaderboard-row ${isMe ? 'highlight' : ''}`}>
                <div className="leaderboard-rank">#{idx + 1}</div>
                <div className="leaderboard-name">{player.playerName} {isMe && '(You)'}</div>
                <div className="leaderboard-score">{player.score}</div>
              </div>
            );
          })}
        </div>
      )}

      <p className="text-muted animate-fade-in-up" style={{ marginTop: 32, fontWeight: 600, animationDelay: '0.5s', animationFillMode: 'both' }}>Awaiting next question...</p>
    </div>
  );
}
