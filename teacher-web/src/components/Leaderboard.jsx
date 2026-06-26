import { useEffect, useState, useMemo } from 'react';

const PODIUM_CONFIG = [
  { rank: 2, label: '🥈', color: '#94a3b8', height: '100px', order: 1 },
  { rank: 1, label: '🥇', color: '#f39c12', height: '140px', order: 2 },
  { rank: 3, label: '🥉', color: '#cd7f32', height: '80px', order: 3 },
];

function ConfettiPiece({ index }) {
  const style = useMemo(() => ({
    position: 'absolute',
    left: `${Math.random() * 100}%`,
    top: '-10px',
    width: `${6 + Math.random() * 8}px`,
    height: `${6 + Math.random() * 8}px`,
    borderRadius: Math.random() > 0.5 ? '50%' : '2px',
    background: ['#6c5ce7', '#e74c3c', '#f39c12', '#00b894', '#3498db', '#fd79a8'][index % 6],
    animation: `confetti-fall ${2 + Math.random() * 3}s linear ${Math.random() * 2}s forwards`,
    opacity: 0.8,
  }), [index]);

  return <div style={style} />;
}

function DeltaBadge({ delta }) {
  if (!delta || delta === 0) return null;
  return (
    <span className="animate-float-up text-sm font-bold text-[var(--accent-success)] ml-2">
      +{delta}
    </span>
  );
}

export default function Leaderboard({
  leaderboard = [],
  isGameOver,
  onNextQuestion,
  onBackHome,
}) {
  const [showConfetti, setShowConfetti] = useState(false);

  useEffect(() => {
    if (leaderboard.length > 0) {
      setShowConfetti(true);
      const timer = setTimeout(() => setShowConfetti(false), 4000);
      return () => clearTimeout(timer);
    }
  }, [leaderboard]);

  const top3 = leaderboard.slice(0, 3);
  const rest = leaderboard.slice(3);

  // Re-order top3 for podium: [2nd, 1st, 3rd]
  const podiumOrder = [];
  if (top3[1]) podiumOrder.push({ ...top3[1], podiumIndex: 0 });
  if (top3[0]) podiumOrder.push({ ...top3[0], podiumIndex: 1 });
  if (top3[2]) podiumOrder.push({ ...top3[2], podiumIndex: 2 });

  return (
    <div className="screen-enter min-h-screen flex flex-col items-center justify-center p-4 md:p-8 relative overflow-hidden">
      {/* Confetti */}
      {showConfetti && (
        <div className="fixed inset-0 pointer-events-none z-50">
          {Array.from({ length: 40 }).map((_, i) => (
            <ConfettiPiece key={i} index={i} />
          ))}
        </div>
      )}

      <div className="max-w-2xl w-full">
        {/* Title */}
        <div className="text-center mb-8 animate-slide-in-down">
          <h1 className="text-3xl md:text-4xl font-extrabold mb-1">
            {isGameOver ? (
              <span className="gradient-text-gold">🏆 Final Standings</span>
            ) : (
              <span className="gradient-text">📊 Leaderboard</span>
            )}
          </h1>
          {isGameOver && (
            <p className="text-[var(--text-muted)] text-sm">Congratulations to all participants!</p>
          )}
        </div>

        {/* Podium (Top 3) */}
        {top3.length > 0 && (
          <div className="flex items-end justify-center gap-3 md:gap-4 mb-8 animate-fade-in-up">
            {podiumOrder.map((player) => {
              const config = PODIUM_CONFIG[player.podiumIndex];
              return (
                <div
                  key={player.name}
                  className="flex flex-col items-center"
                  style={{ order: config.order }}
                >
                  {/* Medal & Name */}
                  <div className="text-3xl mb-2">{config.label}</div>
                  <p className="text-white font-bold text-sm md:text-base mb-1 truncate max-w-[100px]">
                    {player.name}
                  </p>
                  <p className="font-extrabold text-lg md:text-xl mb-2" style={{ color: config.color }}>
                    {player.score?.toLocaleString()}
                    <DeltaBadge delta={player.delta} />
                  </p>
                  {/* Podium Block */}
                  <div
                    className="w-20 md:w-24 rounded-t-xl flex items-end justify-center"
                    style={{
                      height: config.height,
                      background: `linear-gradient(180deg, ${config.color}40, ${config.color}15)`,
                      border: `1px solid ${config.color}30`,
                      borderBottom: 'none',
                    }}
                  >
                    <span
                      className="text-4xl font-extrabold mb-3"
                      style={{ color: `${config.color}80` }}
                    >
                      {player.rank || config.rank === 1 ? config.rank : config.rank}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Rest of Leaderboard */}
        {rest.length > 0 && (
          <div className="glass-card p-4 mb-8 space-y-2 animate-fade-in-up" style={{ animationDelay: '200ms' }}>
            {rest.map((player, index) => {
              const maxScore = leaderboard[0]?.score || 1;
              const barPercent = maxScore > 0 ? (player.score / maxScore) * 100 : 0;

              return (
                <div
                  key={player.name}
                  className="flex items-center gap-3 p-3 rounded-lg hover:bg-white/5 transition-colors duration-200"
                  style={{
                    animation: `fadeInUp 0.3s ease ${(index + 3) * 60}ms both`,
                  }}
                >
                  {/* Rank */}
                  <span className="w-8 text-center text-sm font-bold text-[var(--text-dimmed)]">
                    #{player.rank || index + 4}
                  </span>
                  {/* Name */}
                  <span className="flex-1 font-medium text-sm text-white truncate">
                    {player.name}
                  </span>
                  {/* Score Bar */}
                  <div className="w-32 md:w-48 h-2 rounded-full bg-white/5 overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{
                        width: `${barPercent}%`,
                        background: 'linear-gradient(90deg, #6c5ce7, #a78bfa)',
                      }}
                    />
                  </div>
                  {/* Score */}
                  <span className="text-sm font-bold text-[var(--text-muted)] tabular-nums w-16 text-right">
                    {player.score?.toLocaleString()}
                    <DeltaBadge delta={player.delta} />
                  </span>
                </div>
              );
            })}
          </div>
        )}

        {/* Empty state */}
        {leaderboard.length === 0 && (
          <div className="glass-card p-8 text-center mb-8 animate-fade-in">
            <p className="text-[var(--text-dimmed)]">No scores yet</p>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-center gap-4 animate-fade-in-up" style={{ animationDelay: '400ms' }}>
          {isGameOver ? (
            <button
              className="btn-primary text-base px-8 py-3"
              onClick={onBackHome}
              id="back-home-btn"
            >
              🏠 Back to Home
            </button>
          ) : (
            <button
              className="btn-success text-base px-8 py-3"
              onClick={onNextQuestion}
              id="next-question-btn"
            >
              ▶ Next Question
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
