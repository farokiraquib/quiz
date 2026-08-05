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
  onEditQuestions,
  optionCounts = {},
}) {
  const elapsed = (question?.serverStartTime && question?.serverTimeNow) 
    ? Math.max(0, (question.serverTimeNow - question.serverStartTime) / 1000) 
    : 0;
  const initialTimeLeft = Math.ceil(Math.max(0, timeLimit - elapsed));

  const [timeLeft, setTimeLeft] = useState(initialTimeLeft);
  const [isTimerDone, setIsTimerDone] = useState(false);
  const intervalRef = useRef(null);

  // Reset timer when question changes
  useEffect(() => {
    const el = (question?.serverStartTime && question?.serverTimeNow) 
      ? Math.max(0, (question.serverTimeNow - question.serverStartTime) / 1000) 
      : 0;
    const startLeft = Math.ceil(Math.max(0, timeLimit - el));
    
    setTimeLeft(startLeft);
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
  }, [questionIndex, timeLimit, question]);

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

  return (
    <div className="screen-enter min-h-screen flex flex-col items-center p-4 md:p-8 relative bg-black">
      <div className="max-w-4xl w-full">
        {/* Top Controls */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          
          {/* Room Code Badge */}
          <div className="bg-white/10 backdrop-blur-md px-4 py-2 rounded-xl border border-white/20 shadow-lg flex flex-col">
            <span className="text-[10px] uppercase font-bold text-white/50 tracking-widest mb-1">Room Code</span>
            <span className="text-2xl font-black text-white tracking-[0.2em]">{roomCode}</span>
          </div>

          <div className="flex flex-col items-start md:items-end gap-3">
            <label className="flex items-center gap-2 text-xs md:text-sm font-bold text-white/70 bg-[#0a0a0a] px-3 py-2 rounded-lg border border-white/10 select-none hover:text-white transition-colors">
              <input 
                type="checkbox" 
                checked={showStudentLeaderboard}
                onChange={(e) => setShowStudentLeaderboard(e.target.checked)}
                className="accent-yellow-400 cursor-pointer w-4 h-4"
              />
              Show Leaderboard to Students
            </label>
            <button 
              onClick={onEditQuestions}
              className="btn-outline text-xs md:text-sm py-2 px-4"
            >
              Edit Upcoming Questions
            </button>
          </div>
        </div>

        {/* Question Header */}
        <div className="flex items-center justify-between mb-8 animate-slide-in-down">
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
          {question?.options?.map((opt, i) => {
            const count = optionCounts[i] || 0;
            const percent = totalPlayers > 0 ? (count / totalPlayers) * 100 : 0;
            
            return (
              <div
                key={i}
                className="relative rounded-2xl p-5 flex items-center gap-4 bg-[#171717] border border-white/10 overflow-hidden"
              >
                {/* Live Progress Bar Background */}
                <div 
                  className="absolute left-0 top-0 bottom-0 bg-white/10 transition-all duration-300 ease-out z-0" 
                  style={{ width: `${percent}%` }}
                />
                
                <span className="w-10 h-10 rounded-xl bg-white text-black flex items-center justify-center text-lg font-black shrink-0 relative z-10">
                  {OPTION_COLORS[i].label}
                </span>
                <div className="flex flex-col flex-1 relative z-10">
                  {opt?.imageUrl && (
                    <img src={opt.imageUrl} alt="Option" className="max-h-24 rounded-lg mb-3 object-contain border border-white/10 bg-black/20" />
                  )}
                  <div className="flex justify-between items-center w-full">
                    <span className="text-white font-bold text-lg md:text-xl">
                      {typeof opt === 'object' ? opt.text : opt}
                    </span>
                    <span className="text-white/50 font-bold ml-2">
                      {count} <span className="text-xs font-normal">picks</span>
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
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
    </div>
  );
}
