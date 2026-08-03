import { useState, useEffect, useRef } from 'react';
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
  showStudentLeaderboard,
  setShowStudentLeaderboard,
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
    <div className="screen-enter min-h-screen flex flex-col items-center p-4 md:p-8 relative bg-black">
      <div className="max-w-4xl w-full relative">
        <div className="absolute top-0 right-0 z-10 flex flex-col items-end md:flex-row gap-2 md:gap-4 md:items-center">
          <label className="flex items-center gap-2 cursor-pointer text-xs md:text-sm text-white/70 hover:text-white transition-colors">
            <input 
              type="checkbox" 
              checked={showStudentLeaderboard}
              onChange={(e) => setShowStudentLeaderboard(e.target.checked)}
              className="accent-yellow-400 cursor-pointer w-4 h-4"
            />
            Show Leaderboard to Students
          </label>
          <button 
            onClick={() => setIsEditing(true)}
            className="btn-outline text-xs md:text-sm py-2 px-4"
          >
            Edit Upcoming Questions
          </button>
        </div>

        {/* Question Header */}
        <div className="flex items-center justify-between mb-8 pt-20 md:pt-0 animate-slide-in-down">
          <div className="bg-[#0a0a0a] border border-white/10 rounded-xl px-5 py-3 flex items-center gap-3">
            <span className="text-xl">🎯</span>
            <span className="text-sm font-bold text-white/50 uppercase tracking-wider">Question</span>
            <span className="text-xl font-black text-white">
              {questionIndex + 1}
              <span className="text-white/30 text-lg"> / {totalQuestions}</span>
            </span>
          </div>
          <div
            className={`px-5 py-3 rounded-xl flex items-center gap-3 border ${
              isTimerCritical ? 'border-red-500 bg-red-500/10' : 'border-white/10 bg-[#0a0a0a]'
            }`}
          >
            <span className="text-xl">⏱️</span>
            <span className={`text-3xl font-black tabular-nums ${
              isTimerCritical
                ? 'text-red-500'
                : isTimerDone
                ? 'text-white/30'
                : 'text-white'
            }`}
            >
              {timeLeft}
              <span className="text-lg opacity-50 ml-1">s</span>
            </span>
          </div>
        </div>

        {/* Timer Bar */}
        <div className="w-full h-2 rounded-full bg-[#171717] mb-10 overflow-hidden border border-white/5">
          <div
            className={`h-full transition-all duration-1000 linear ${
              isTimerCritical ? 'bg-red-500' : 'bg-white'
            }`}
            style={{ width: `${timerPercent}%` }}
          />
        </div>

        {/* Question Card */}
        <div className="bg-[#0a0a0a] border border-white/10 rounded-2xl p-8 md:p-12 mb-8 flex flex-col items-center">
          {question?.imageUrl && (
            <div className="p-2 bg-white/5 rounded-xl mb-6 border border-white/10">
              <img src={question.imageUrl} alt="Question" className="max-h-64 rounded-lg object-contain" />
            </div>
          )}
          <h2 className="text-3xl md:text-5xl font-black text-white text-center leading-tight">
            {question?.text || 'Loading question...'}
          </h2>
        </div>

        {/* Options Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-10">
          {question?.options?.map((opt, i) => (
            <div
              key={i}
              className="rounded-2xl p-5 flex items-center gap-4 bg-[#171717] border border-white/10"
            >
              <span className="w-10 h-10 rounded-xl bg-white text-black flex items-center justify-center text-lg font-black shrink-0">
                {OPTION_COLORS[i].label}
              </span>
              <div className="flex flex-col flex-1">
                {opt?.imageUrl && (
                  <img src={opt.imageUrl} alt="Option" className="max-h-24 rounded-lg mb-3 object-contain border border-white/10 bg-black/20" />
                )}
                <span className="text-white font-bold text-lg md:text-xl">
                  {opt?.text || opt}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Answer Progress */}
        <div className="bg-[#0a0a0a] border border-white/10 rounded-2xl p-6 mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <span className="text-2xl">📈</span>
              <span className="text-sm font-bold text-white/50 uppercase tracking-wider">Responses</span>
            </div>
            <span className="text-xl font-black text-white">
              <span className="bg-white/10 px-3 py-1 rounded-lg mr-2">{answeredCount}</span>
              <span className="text-white/40">/ {totalPlayers}</span>
            </span>
          </div>
          <div className="w-full h-3 rounded-full bg-[#171717] overflow-hidden border border-white/5">
            <div
              className="h-full transition-all duration-300 ease-out bg-white"
              style={{ width: `${answerPercent}%` }}
            />
          </div>
        </div>

        {/* End Question Button */}
        {showEndButton && (
          <div className="text-center">
            <button
              className="btn-primary px-8 py-3 w-full md:w-auto"
              onClick={onEndQuestion}
              id="end-question-btn"
            >
              Show Results (Early)
            </button>
          </div>
        )}
      </div>
      
      {/* Editor Modal */}
      {isEditing && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-[#0a0a0a] border border-white/10 rounded-2xl w-full max-w-2xl max-h-[85vh] flex flex-col p-6 overflow-hidden shadow-2xl">
            <h3 className="text-xl font-bold text-white mb-6">Edit Upcoming Questions</h3>
            
            <div className="flex-1 overflow-y-auto pr-2 space-y-4 mb-6">
              {editableQuestions.map((q, idx) => (
                <div key={idx} className="p-4 border border-white/10 bg-[#171717] rounded-xl relative">
                  {idx <= questionIndex ? (
                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center rounded-xl z-10 backdrop-blur-sm">
                      <span className="text-white/80 text-sm font-bold uppercase tracking-wider">Locked (Past/Current)</span>
                    </div>
                  ) : null}
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-sm font-bold text-white/50 uppercase">Question {idx + 1}</span>
                    <button onClick={() => removeUpcomingQuestion(idx)} className="text-red-400 hover:text-red-300 text-xs font-bold uppercase">Remove</button>
                  </div>
                  <input 
                    type="text" 
                    value={q.text} 
                    onChange={(e) => updateUpcomingQuestion(idx, e.target.value)}
                    className="w-full bg-black border border-white/10 rounded-lg px-4 py-3 text-white text-sm outline-none focus:border-white/30 transition-colors"
                  />
                </div>
              ))}
              <button onClick={addUpcomingQuestion} className="w-full py-4 border border-dashed border-white/20 text-white/50 font-bold rounded-xl hover:bg-white/5 transition-colors">
                + Add New Question
              </button>
            </div>
            
            <div className="flex gap-3 justify-end pt-4 border-t border-white/10">
              <button onClick={() => setIsEditing(false)} className="btn-ghost px-6 py-2.5">Cancel</button>
              <button onClick={handleSaveQuestions} className="btn-primary px-6 py-2.5">Save Changes</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
