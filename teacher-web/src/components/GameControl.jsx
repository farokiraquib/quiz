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
              background: 'var(--text-primary)',
            }}
          />
        </div>

        {/* Question Card */}
        <div className="glass-card-accent p-6 md:p-8 mb-6 animate-fade-in-up flex flex-col items-center">
          {question?.imageUrl && (
            <img src={question.imageUrl} alt="Question" className="max-h-48 rounded mb-4 object-contain" />
          )}
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
                border: '1px solid var(--border-subtle)',
              }}
            >
              <span className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center text-sm font-bold text-white shrink-0">
                {OPTION_COLORS[i].label}
              </span>
              <div className="flex flex-col flex-1">
                {opt?.imageUrl && (
                  <img src={opt.imageUrl} alt="Option" className="max-h-20 rounded mb-2 object-contain" />
                )}
                <span className="text-white font-medium text-sm md:text-base">
                  {opt?.text || opt}
                </span>
              </div>
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
                background: 'var(--text-primary)',
              }}
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
