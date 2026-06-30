import { useState, useEffect, useRef, useCallback } from 'react';
import socket from '../socket';

const OPTION_COLORS = [
  { bg: '#171717', label: 'A' },
  { bg: '#171717', label: 'B' },
  { bg: '#171717', label: 'C' },
  { bg: '#171717', label: 'D' },
];

export default function GameControl({
  roomCode,
  hostSecret,
  questions: initialQuestions,
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
  const [isEditing, setIsEditing] = useState(false);
  const [editableQuestions, setEditableQuestions] = useState([...initialQuestions]);
  const intervalRef = useRef(null);

  // Sync with initialQuestions if they change from outside
  useEffect(() => {
    setEditableQuestions([...initialQuestions]);
  }, [initialQuestions]);

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

  // Auto-end question when timer is done
  useEffect(() => {
    if (isTimerDone) {
      onEndQuestion();
    }
  }, [isTimerDone, onEndQuestion]);

  const timerPercent = (timeLeft / timeLimit) * 100;
  const answerPercent = totalPlayers > 0 ? (answeredCount / totalPlayers) * 100 : 0;
  const isTimerCritical = timeLeft <= 5 && timeLeft > 0;
  const allAnswered = totalPlayers > 0 && answeredCount === totalPlayers;
  const showEndButton = allAnswered && !isTimerDone;

  const handleSaveQuestions = () => {
    socket.emit('host:update-questions', {
      roomCode,
      hostSecret,
      questions: editableQuestions,
    });
    setIsEditing(false);
  };

  const updateUpcomingQuestion = (idx, text) => {
    const updated = [...editableQuestions];
    updated[idx].text = text;
    setEditableQuestions(updated);
  };

  const removeUpcomingQuestion = (idx) => {
    const updated = [...editableQuestions];
    updated.splice(idx, 1);
    setEditableQuestions(updated);
  };

  const addUpcomingQuestion = () => {
    setEditableQuestions([
      ...editableQuestions,
      {
        type: 'single',
        text: 'New Question',
        imageUrl: null,
        imageId: null,
        options: [
          { text: 'A', imageUrl: null, imageId: null },
          { text: 'B', imageUrl: null, imageId: null },
          { text: 'C', imageUrl: null, imageId: null },
          { text: 'D', imageUrl: null, imageId: null },
        ],
        correctIndices: [0],
        timeLimit: 20,
      }
    ]);
  };

  return (
    <div className="screen-enter min-h-screen flex flex-col items-center justify-center p-4 md:p-8 relative">
      <div className="max-w-3xl w-full relative mt-12 md:mt-0">
        <div className="absolute -top-12 right-0 z-10">
          <button 
            onClick={() => setIsEditing(true)}
            className="btn-ghost text-xs md:text-sm py-2 px-4"
          >
            Edit Upcoming Questions
          </button>
        </div>

        {/* Question Header */}
        <div className="flex items-center justify-between mb-8 animate-slide-in-down">
          <div className="glass-card px-5 py-2.5 flex items-center gap-3 border-[var(--border-subtle)]">
            <span className="text-xl">🎯</span>
            <span className="text-sm font-bold text-[var(--text-muted)] uppercase tracking-wider">Question</span>
            <span className="text-xl font-black text-white">
              {questionIndex + 1}
              <span className="text-white/30 text-lg"> / {totalQuestions}</span>
            </span>
          </div>
          <div
            className={`glass-card px-5 py-2.5 flex items-center gap-3 border-2 ${
              isTimerCritical ? 'border-red-500 bg-red-500/10 shadow-[0_0_20px_rgba(239,68,68,0.5)]' : 'border-[var(--accent-secondary)] bg-[var(--accent-secondary)]/10 shadow-[0_0_20px_rgba(6,182,212,0.2)]'
            }`}
          >
            <span className="text-xl">⏱️</span>
            <span className={`text-3xl font-black tabular-nums ${
              isTimerCritical
                ? 'text-red-400'
                : isTimerDone
                ? 'text-white/30'
                : 'text-[var(--accent-secondary)] drop-shadow-[0_0_8px_rgba(6,182,212,0.8)]'
            }`}
              style={isTimerCritical ? { animation: 'countdown-pulse 1s ease-in-out infinite' } : {}}
            >
              {timeLeft}
              <span className="text-lg opacity-50 ml-1">s</span>
            </span>
          </div>
        </div>

        {/* Timer Bar */}
        <div className="w-full h-3 rounded-full bg-white/5 mb-10 overflow-hidden shadow-inner animate-fade-in border border-white/5">
          <div
            className={`h-full rounded-full transition-all duration-1000 linear ${
              isTimerCritical ? 'bg-gradient-to-r from-red-600 to-red-400 shadow-[0_0_15px_rgba(239,68,68,0.8)]' : 'bg-gradient-to-r from-[var(--accent-secondary)] to-blue-400 shadow-[0_0_15px_rgba(6,182,212,0.8)]'
            }`}
            style={{ width: `${timerPercent}%` }}
          />
        </div>

        {/* Question Card */}
        <div className="glass-card-accent p-8 md:p-12 mb-8 animate-fade-in-up flex flex-col items-center border-[var(--accent-primary-glow)] bg-[var(--bg-surface-active)]">
          {question?.imageUrl && (
            <div className="p-2 bg-white/5 rounded-2xl mb-6 shadow-xl border border-white/10">
              <img src={question.imageUrl} alt="Question" className="max-h-56 rounded-xl object-contain" />
            </div>
          )}
          <h2 className="text-3xl md:text-5xl font-black text-white text-center leading-tight drop-shadow-md">
            {question?.text || 'Loading question...'}
          </h2>
        </div>

        {/* Options Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-10">
          {question?.options?.map((opt, i) => (
            <div
              key={i}
              className="relative rounded-2xl p-5 flex items-center gap-4 animate-fade-in-up shadow-[0_4px_20px_rgba(0,0,0,0.3)] hover:-translate-y-1 transition-transform overflow-hidden"
              style={{
                background: `linear-gradient(135deg, ${OPTION_COLORS[i].bg}, #0a0a0a)`,
                animationDelay: `${i * 80}ms`,
                border: '1px solid rgba(255,255,255,0.1)',
              }}
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-2xl -mr-16 -mt-16 pointer-events-none" />
              <span className="w-10 h-10 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center text-lg font-black text-white shrink-0 drop-shadow-md">
                {OPTION_COLORS[i].label}
              </span>
              <div className="flex flex-col flex-1 z-10">
                {opt?.imageUrl && (
                  <img src={opt.imageUrl} alt="Option" className="max-h-24 rounded-lg mb-3 object-contain border border-white/10 bg-black/20" />
                )}
                <span className="text-white font-bold text-lg md:text-xl drop-shadow-sm">
                  {opt?.text || opt}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Answer Progress */}
        <div className="glass-card p-6 mb-8 animate-fade-in-up border-[var(--border-subtle)]" style={{ animationDelay: '300ms' }}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <span className="text-2xl">📈</span>
              <span className="text-sm font-bold text-[var(--text-muted)] uppercase tracking-wider">Responses</span>
            </div>
            <span className="text-xl font-black">
              <span className="text-white bg-white/10 px-3 py-1 rounded-lg mr-2">{answeredCount}</span>
              <span className="text-white/40">/ {totalPlayers}</span>
            </span>
          </div>
          <div className="w-full h-4 rounded-full bg-black/40 overflow-hidden shadow-inner border border-white/5">
            <div
              className="h-full rounded-full transition-all duration-300 ease-out bg-gradient-to-r from-[var(--accent-primary)] to-[var(--accent-secondary)] shadow-[0_0_10px_var(--accent-primary-glow)]"
              style={{ width: `${answerPercent}%` }}
            />
          </div>
        </div>

        {/* End Question Button */}
        {showEndButton && (
          <div className="text-center animate-fade-in-up" style={{ animationDelay: '400ms' }}>
            <button
              className="btn-primary text-base px-8 py-3"
              onClick={onEndQuestion}
              id="end-question-btn"
            >
              Show Results (Early)
            </button>
          </div>
        )}
        {/* Editor Modal */}
      </div>
      
      {isEditing && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
          <div className="glass-card w-full max-w-2xl max-h-[80vh] flex flex-col p-6 overflow-hidden">
            <h3 className="text-xl font-bold text-white mb-4">Edit Upcoming Questions</h3>
            <div className="flex-1 overflow-y-auto pr-2 space-y-4 mb-4">
              {editableQuestions.map((q, idx) => (
                <div key={idx} className="p-4 border border-white/10 rounded-lg relative">
                  {idx <= questionIndex ? (
                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center rounded-lg z-10">
                      <span className="text-white/80 text-sm">Cannot edit past or current questions</span>
                    </div>
                  ) : null}
                  <div className="flex justify-between mb-2">
                    <span className="text-sm text-white/50">Q{idx + 1}</span>
                    <button onClick={() => removeUpcomingQuestion(idx)} className="text-red-400 text-xs">Remove</button>
                  </div>
                  <input 
                    type="text" 
                    value={q.text} 
                    onChange={(e) => updateUpcomingQuestion(idx, e.target.value)}
                    className="input-field w-full text-sm"
                  />
                </div>
              ))}
              <button onClick={addUpcomingQuestion} className="w-full py-3 border border-dashed border-white/20 text-white/50 rounded-lg hover:bg-white/5">
                + Add New Question
              </button>
            </div>
            <div className="flex gap-3 justify-end pt-4 border-t border-white/10">
              <button onClick={() => setIsEditing(false)} className="btn-ghost px-4 py-2 text-sm">Cancel</button>
              <button onClick={handleSaveQuestions} className="btn-primary px-4 py-2 text-sm">Save Changes</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
