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
        <div className="mb-10 animate-fade-in-up">
          <p className="text-sm font-semibold tracking-widest uppercase text-[var(--text-muted)] mb-3">
            Room Code
          </p>
          <div
            className="glass-card-accent inline-block px-8 py-5 mb-4 cursor-pointer group animate-pulse-glow"
            onClick={copyCode}
            title="Click to copy"
          >
            <h1
              className="text-6xl md:text-8xl font-semibold tracking-[0.2em] text-[var(--text-primary)] select-all"
              style={{ letterSpacing: '0.25em' }}
              id="room-code-display"
            >
              {roomCode}
            </h1>
          </div>
          <div className="h-6">
            {copied ? (
              <p className="text-sm text-[var(--accent-success)] animate-fade-in">
                ✓ Copied to clipboard!
              </p>
            ) : (
              <p className="text-sm text-[var(--text-dimmed)]">
                Click the code to copy • Share with your students
              </p>
            )}
          </div>
        </div>

        {/* Player Count */}
        <div className="mb-6 animate-fade-in-up" style={{ animationDelay: '100ms' }}>
          <div className="glass-card inline-flex items-center gap-3 px-5 py-3">
            <div className="w-2.5 h-2.5 rounded-full bg-[var(--accent-success)] animate-pulse" />
            <span className="text-lg font-semibold">
              <span className="text-2xl font-bold text-white">{players.length}</span>
              <span className="text-[var(--text-muted)] ml-1.5">
                {players.length === 1 ? 'student' : 'students'} joined
              </span>
            </span>
          </div>
        </div>

        {/* Players Grid */}
        <div
          className="glass-card p-5 mb-8 min-h-[120px] animate-fade-in-up"
          style={{ animationDelay: '200ms' }}
        >
          {players.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8">
              <p className="text-[var(--text-dimmed)] text-sm">
                Waiting for students to join...
              </p>
            </div>
          ) : (
            <div className="flex flex-wrap gap-2.5 justify-center">
              {players.map((player, index) => (
                <div
                  key={player.id || player.name || index}
                  className="animate-badge-enter px-4 py-2 rounded-full text-sm font-medium"
                  style={{
                    animationDelay: `${index * 60}ms`,
                    background: 'var(--bg-surface-hover)',
                    border: '1px solid var(--border-subtle)',
                    color: 'var(--text-primary)',
                    boxShadow: 'none',
                  }}
                >
                  {player.name || player}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Start Button */}
        <div className="animate-fade-in-up" style={{ animationDelay: '300ms' }}>
          <button
            className="btn-success text-lg px-12 py-4"
            onClick={onStart}
            disabled={players.length < 1}
            id="start-quiz-btn"
          >
            {players.length < 1 ? (
              'Waiting for students...'
            ) : (
              <>Start Quiz</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
