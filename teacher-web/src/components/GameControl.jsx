import { useState, useEffect, useRef } from 'react';

const OPTION_COLORS = [
  { bg: '#e74c3c', label: 'A' },
  { bg: '#3498db', label: 'B' },
  { bg: '#f39c12', label: 'C' },
  { bg: '#2ecc71', label: 'D' },
];

export default function GameControl({
  question,
  questionIndex,
  totalQuestions,
  answeredCount,
  totalPlayers,
  timeLimit,
  onEndQuestion,
}) {
  const [timeLeft, setTimeLeft] = useState(timeLimit);
  const [isTimerDone, setIsTimerDone] = useState(false);
  const intervalRef = useRef(null);

  // Reset timer when question changes
  useEffect(() => {
    setTimeLeft(timeLimit);
    setIsTimerDone(false);

    intervalRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(intervalRef.current);
          setIsTimerDone(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [questionIndex, timeLimit]);

  const timerPercent = (timeLeft / timeLimit) * 100;
  const answerPercent = totalPlayers > 0 ? (answeredCount / totalPlayers) * 100 : 0;
  const isTimerCritical = timeLeft <= 5 && timeLeft > 0;

  return (
    <div className="screen-enter min-h-screen flex flex-col items-center justify-center p-4 md:p-8">
      <div className="max-w-3xl w-full">
        {/* Question Header */}
        <div className="flex items-center justify-between mb-6 animate-slide-in-down">
          <div className="glass-card px-4 py-2 flex items-center gap-2">
            <span className="text-sm text-[var(--text-muted)]">Question</span>
            <span className="text-lg font-bold text-white">
              {questionIndex + 1}
              <span className="text-[var(--text-dimmed)]"> / {totalQuestions}</span>
            </span>
          </div>
          <div
            className={`glass-card px-4 py-2 flex items-center gap-2 ${
              isTimerCritical ? 'border-red-500/50' : ''
            }`}
          >
            <span className={`text-2xl font-bold tabular-nums ${
              isTimerCritical
                ? 'text-red-400'
                : isTimerDone
                ? 'text-[var(--text-dimmed)]'
                : 'text-white'
            }`}
              style={isTimerCritical ? { animation: 'countdown-pulse 1s ease-in-out infinite' } : {}}
            >
              {timeLeft}s
            </span>
          </div>
        </div>

        {/* Timer Bar */}
        <div className="w-full h-2 rounded-full bg-white/5 mb-8 overflow-hidden animate-fade-in">
          <div
            className="h-full rounded-full transition-all duration-1000 linear"
            style={{
              width: `${timerPercent}%`,
              background:
                timeLeft <= 5
                  ? 'linear-gradient(90deg, #e74c3c, #ff6b6b)'
                  : timeLeft <= 10
                  ? 'linear-gradient(90deg, #f39c12, #f1c40f)'
                  : 'linear-gradient(90deg, #6c5ce7, #a78bfa)',
            }}
          />
        </div>

        {/* Question Card */}
        <div className="glass-card-accent p-6 md:p-8 mb-6 animate-fade-in-up">
          <h2 className="text-xl md:text-2xl font-bold text-white text-center leading-relaxed">
            {question?.text || 'Loading question...'}
          </h2>
        </div>

        {/* Options Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-8">
          {question?.options?.map((opt, i) => (
            <div
              key={i}
              className="rounded-xl p-4 flex items-center gap-3 animate-fade-in-up"
              style={{
                background: OPTION_COLORS[i].bg,
                animationDelay: `${i * 80}ms`,
                boxShadow: `0 4px 15px ${OPTION_COLORS[i].bg}33`,
              }}
            >
              <span className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center text-sm font-bold text-white shrink-0">
                {OPTION_COLORS[i].label}
              </span>
              <span className="text-white font-medium text-sm md:text-base">
                {opt}
              </span>
            </div>
          ))}
        </div>

        {/* Answer Progress */}
        <div className="glass-card p-5 mb-6 animate-fade-in-up" style={{ animationDelay: '300ms' }}>
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-[var(--text-muted)]">Responses</span>
            <span className="text-lg font-bold">
              <span className="text-white">{answeredCount}</span>
              <span className="text-[var(--text-dimmed)]"> / {totalPlayers}</span>
            </span>
          </div>
          <div className="w-full h-3 rounded-full bg-white/5 overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-300 ease-out"
              style={{
                width: `${answerPercent}%`,
                background: 'linear-gradient(90deg, #00b894, #55efc4)',
              }}
            />
          </div>
        </div>

        {/* End Question Button */}
        <div className="text-center animate-fade-in-up" style={{ animationDelay: '400ms' }}>
          <button
            className="btn-primary text-base px-8 py-3"
            onClick={onEndQuestion}
            id="end-question-btn"
          >
            {isTimerDone ? '📊 Show Results' : '⏹ End Question'}
          </button>
        </div>
      </div>
    </div>
  );
}
