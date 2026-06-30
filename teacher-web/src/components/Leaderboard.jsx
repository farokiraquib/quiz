import { useEffect, useState, useMemo } from 'react';
import { Download } from 'lucide-react';

const PODIUM_CONFIG = [
  { rank: 2, label: '🥈', color: '#94a3b8', height: '120px', order: 1, glow: 'rgba(148,163,184,0.4)' },
  { rank: 1, label: '🏆', color: '#fbbf24', height: '160px', order: 2, glow: 'rgba(251,191,36,0.6)' },
  { rank: 3, label: '🥉', color: '#cd7f32', height: '90px', order: 3, glow: 'rgba(205,127,50,0.4)' },
];


function DeltaBadge({ delta }) {
  if (!delta || delta === 0) return null;
  return (
    <span className="animate-float-up text-xs font-black text-[var(--accent-success)] ml-2 bg-[var(--accent-success)]/20 px-1.5 py-0.5 rounded shadow-[0_0_10px_var(--accent-success-glow)]">
      +{delta}
    </span>
  );
}

export default function Leaderboard({
  leaderboard = [],
  isGameOver,
  onNextQuestion,
  onBackHome,
  plan,
  roomCode
}) {


  const top3 = leaderboard.slice(0, 3);
  const rest = leaderboard.slice(3);

  // Re-order top3 for podium: [2nd, 1st, 3rd]
  const podiumOrder = [];
  if (top3[1]) podiumOrder.push({ ...top3[1], podiumIndex: 0 });
  if (top3[0]) podiumOrder.push({ ...top3[0], podiumIndex: 1 });
  if (top3[2]) podiumOrder.push({ ...top3[2], podiumIndex: 2 });

  const isPaidPlan = plan && plan !== 'FREE';

  const downloadCSV = () => {
    if (!isPaidPlan) {
      alert("CSV Export is only available on paid plans (Semester Pass, Annual Pro, Institute). Please upgrade to use this feature.");
      return;
    }
    
    if (leaderboard.length === 0) return;
    
    const headers = ['Rank', 'Student Name', 'Score'];
    const csvContent = [
      headers.join(','),
      ...leaderboard.map((p, i) => `${p.rank || i + 1},"${p.name.replace(/"/g, '""')}",${p.score}`)
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `LiveQuizz_Results_${roomCode || 'Session'}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="screen-enter min-h-screen flex flex-col items-center justify-center p-4 md:p-8 relative overflow-hidden">


      <div className="max-w-3xl w-full relative">
        {/* Title */}
        <div className="text-center mb-12 animate-slide-in-down">
          <div className="inline-flex items-center justify-center p-3 rounded-2xl bg-white/5 border border-white/10 mb-4 shadow-[0_0_30px_rgba(251,191,36,0.2)]">
            <span className="text-4xl">{isGameOver ? '🏁' : '📊'}</span>
          </div>
          <h1 className="text-4xl md:text-6xl font-black mb-2 tracking-tight drop-shadow-lg">
            {isGameOver ? (
              <span className="bg-gradient-to-r from-amber-400 to-amber-600 bg-clip-text text-transparent">Final Standings</span>
            ) : (
              <span className="text-white">Leaderboard</span>
            )}
          </h1>
          {isGameOver && (
            <p className="text-[var(--accent-secondary)] font-bold text-lg tracking-wide uppercase mt-2">Congratulations to all participants!</p>
          )}
        </div>

        {/* Podium (Top 3) */}
        {top3.length > 0 && (
          <div className="flex items-end justify-center gap-4 md:gap-8 mb-12 animate-fade-in-up">
            {podiumOrder.map((player) => {
              const config = PODIUM_CONFIG[player.podiumIndex];
              const isFirst = config.rank === 1;
              return (
                <div
                  key={player.name}
                  className={`flex flex-col items-center ${isFirst ? 'z-10 scale-110' : 'z-0 opacity-90'}`}
                  style={{ order: config.order }}
                >
                  {/* Medal & Name */}
                  <div className={`text-4xl mb-3 ${isFirst ? 'animate-bounce' : ''}`}>{config.label}</div>
                  <p className="text-white font-black text-sm md:text-lg mb-1 truncate max-w-[120px] drop-shadow-md">
                    {player.name}
                  </p>
                  <p className="font-extrabold text-lg md:text-2xl mb-3" style={{ color: config.color, textShadow: `0 0 15px ${config.glow}` }}>
                    {player.score?.toLocaleString()}
                    <DeltaBadge delta={player.delta} />
                  </p>
                  {/* Podium Block */}
                  <div
                    className="w-24 md:w-32 rounded-t-2xl flex items-start justify-center pt-4 shadow-[0_-10px_30px_rgba(0,0,0,0.5)]"
                    style={{
                      height: config.height,
                      background: `linear-gradient(180deg, ${config.color}60, ${config.color}10)`,
                      border: `2px solid ${config.color}50`,
                      borderBottom: 'none',
                      boxShadow: `inset 0 10px 20px ${config.glow}, 0 -10px 30px rgba(0,0,0,0.5)`
                    }}
                  >
                    <span
                      className="text-5xl font-black drop-shadow-lg opacity-80"
                      style={{ color: 'white' }}
                    >
                      {config.rank}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Rest of Leaderboard */}
        {rest.length > 0 && (
          <div className="glass-card p-2 mb-10 space-y-1 animate-fade-in-up shadow-2xl border-white/10" style={{ animationDelay: '200ms' }}>
            {rest.map((player, index) => {
              const maxScore = leaderboard[0]?.score || 1;
              const barPercent = maxScore > 0 ? (player.score / maxScore) * 100 : 0;

              return (
                <div
                  key={player.name}
                  className="flex items-center gap-4 p-4 rounded-xl hover:bg-white/5 transition-colors duration-200"
                  style={{
                    animation: `fadeInUp 0.3s ease ${(index + 3) * 60}ms both`,
                  }}
                >
                  {/* Rank */}
                  <span className="w-8 text-center text-lg font-black text-white/30">
                    {player.rank || index + 4}
                  </span>
                  {/* Name */}
                  <span className="flex-1 font-bold text-base text-white truncate">
                    {player.name}
                  </span>
                  {/* Score Bar */}
                  <div className="w-32 md:w-56 h-3 rounded-full bg-black/40 overflow-hidden shadow-inner border border-white/5 hidden sm:block">
                    <div
                      className="h-full rounded-full transition-all duration-700 bg-gradient-to-r from-gray-600 to-gray-400"
                      style={{ width: `${barPercent}%` }}
                    />
                  </div>
                  {/* Score */}
                  <span className="text-lg font-black text-white tabular-nums w-24 text-right">
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
          <div className="glass-card p-12 text-center mb-10 animate-fade-in border-dashed border-2 border-white/10">
            <p className="text-white/40 text-lg font-bold tracking-widest uppercase">No scores yet</p>
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-wrap items-center justify-center gap-4 animate-fade-in-up" style={{ animationDelay: '400ms' }}>
          {isGameOver && (
            <button
              className={`flex items-center gap-2 px-6 py-4 rounded-2xl font-black text-sm uppercase tracking-widest transition-all ${
                isPaidPlan 
                  ? 'bg-gradient-to-r from-[var(--accent-primary)] to-[var(--accent-secondary)] text-white shadow-[0_5px_15px_var(--accent-primary-glow)] hover:-translate-y-1' 
                  : 'bg-white/10 text-white/50 border border-white/10 hover:bg-white/20'
              }`}
              onClick={downloadCSV}
              title={isPaidPlan ? "Download Gradebook as CSV" : "Upgrade your plan to download CSV"}
            >
              <Download className="w-5 h-5" />
              {isPaidPlan ? 'Export CSV' : 'Export CSV (Pro)'}
            </button>
          )}

          {isGameOver ? (
            <button
              className="bg-white/10 text-white border border-white/20 px-8 py-4 rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-white/20 hover:scale-105 transition-all shadow-[0_5px_15px_rgba(0,0,0,0.3)]"
              onClick={onBackHome}
              id="back-home-btn"
            >
              🏠 Home
            </button>
          ) : (
            <button
              className="bg-gradient-to-r from-[var(--accent-success)] to-emerald-400 text-white px-10 py-4 rounded-2xl font-black text-lg uppercase tracking-widest hover:scale-105 transition-all shadow-[0_5px_20px_var(--accent-success-glow)]"
              onClick={onNextQuestion}
              id="next-question-btn"
            >
              Next Question 🚀
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
