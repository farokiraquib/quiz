import { useState, useCallback } from 'react';

export default function Lobby({ roomCode, players, onStart }) {
  const [copied, setCopied] = useState(false);

  const copyCode = useCallback(() => {
    navigator.clipboard.writeText(roomCode).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, [roomCode]);

  return (
    <div className="screen-enter min-h-screen flex flex-col items-center justify-center p-4 md:p-8">
      <div className="max-w-2xl w-full text-center">
        {/* Room Code Hero */}
        <div className="mb-12 animate-fade-in-up">
          <div className="inline-flex items-center justify-center p-3 rounded-2xl bg-white/5 border border-white/10 mb-6 shadow-[0_0_30px_rgba(6,182,212,0.3)]">
            <span className="text-4xl">🎮</span>
          </div>
          <p className="text-sm font-black tracking-[0.3em] uppercase text-[var(--accent-secondary)] mb-4">
            Join at LiveQuizz.com
          </p>
          <div
            className="glass-card-accent inline-block px-12 py-6 mb-6 cursor-pointer group animate-pulse-glow hover:scale-105 transition-transform duration-300 relative overflow-hidden"
            onClick={copyCode}
            title="Click to copy"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-[var(--accent-primary)] to-[var(--accent-secondary)] opacity-0 group-hover:opacity-20 transition-opacity duration-300" />
            <h1
              className="text-7xl md:text-9xl font-black tracking-[0.25em] text-white select-all drop-shadow-[0_0_15px_rgba(255,255,255,0.5)] group-hover:drop-shadow-[0_0_25px_rgba(255,255,255,0.8)] transition-all"
              id="room-code-display"
            >
              {roomCode}
            </h1>
          </div>
          <div className="h-6">
            {copied ? (
              <p className="text-sm font-bold text-[var(--accent-success)] animate-fade-in flex items-center justify-center gap-2">
                <span className="text-lg">✨</span> Copied to clipboard!
              </p>
            ) : (
              <p className="text-sm font-bold text-white/50 flex items-center justify-center gap-2 group-hover:text-white/80 transition-colors">
                <span className="text-lg">📋</span> Click the code to copy
              </p>
            )}
          </div>
        </div>

        {/* Player Count */}
        <div className="mb-8 animate-fade-in-up" style={{ animationDelay: '100ms' }}>
          <div className="glass-card inline-flex items-center gap-4 px-8 py-4 shadow-[0_0_20px_rgba(16,185,129,0.2)] border-[var(--accent-success)]/30">
            <div className="relative flex h-4 w-4">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[var(--accent-success)] opacity-75"></span>
              <span className="relative inline-flex rounded-full h-4 w-4 bg-[var(--accent-success)]"></span>
            </div>
            <span className="text-xl font-bold text-white/80">
              <span className="text-4xl font-black text-white mr-2">{players.length}</span>
              {players.length === 1 ? 'Student' : 'Students'} Joined
            </span>
          </div>
        </div>

        {/* Players Grid */}
        <div
          className="glass-card p-8 mb-10 min-h-[160px] animate-fade-in-up border-dashed border-2 border-white/10"
          style={{ animationDelay: '200ms' }}
        >
          {players.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 opacity-60">
              <span className="text-5xl mb-4 animate-bounce">👀</span>
              <p className="text-white/60 text-lg font-bold tracking-wider">
                Waiting for students to join...
              </p>
            </div>
          ) : (
            <div className="flex flex-wrap gap-3 justify-center">
              {players.map((player, index) => (
                <div
                  key={player.id || player.name || index}
                  className="animate-badge-enter px-5 py-2.5 rounded-xl text-base font-black shadow-[0_4px_0_rgba(0,0,0,0.3)] hover:-translate-y-1 hover:shadow-[0_6px_0_rgba(0,0,0,0.4)] transition-all"
                  style={{
                    animationDelay: `${index * 60}ms`,
                    background: `linear-gradient(135deg, var(--bg-surface-active), var(--bg-surface))`,
                    border: '2px solid var(--border-subtle)',
                    color: 'white',
                  }}
                >
                  {player.name || player}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Start Button */}
        <div className="animate-fade-in-up pb-10" style={{ animationDelay: '300ms' }}>
          <button
            className={`text-xl font-black px-16 py-5 rounded-2xl shadow-[0_8px_0_rgba(0,0,0,0.5)] active:translate-y-2 active:shadow-[0_0px_0_rgba(0,0,0,0.5)] transition-all ${
              players.length < 1 
                ? 'bg-white/10 text-white/30 cursor-not-allowed border-none' 
                : 'bg-gradient-to-r from-[var(--accent-success)] to-emerald-400 text-white hover:scale-105'
            }`}
            onClick={onStart}
            disabled={players.length < 1}
            id="start-quiz-btn"
          >
            {players.length < 1 ? (
              'WAITING...'
            ) : (
              <>START QUIZ 🚀</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
