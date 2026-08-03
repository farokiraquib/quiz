import React, { useState, useEffect } from 'react';

const COLORS = ['var(--option-a)', 'var(--option-b)', 'var(--option-c)', 'var(--option-d)'];
const SHAPES = ['▲', '◆', '●', '■'];

export default function QuestionScreen({ question, roomCode, onAnswerSubmitted, socket }) {
  const { questionIndex, text, imageUrl, options, timeLimit, serverStartTime, type } = question;
  
  const [timeLeft, setTimeLeft] = useState(timeLimit);
  const [hasAnswered, setHasAnswered] = useState(false);
  const [selectedIndices, setSelectedIndices] = useState([]);

  useEffect(() => {
    setHasAnswered(false);
    setSelectedIndices([]);

    const elapsed = serverStartTime ? Math.max(0, (Date.now() - serverStartTime) / 1000) : 0;
    const remaining = Math.max(0, timeLimit - elapsed);
    setTimeLeft(Math.ceil(remaining));

    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [questionIndex, serverStartTime, timeLimit]);

  const handleOptionClick = (index) => {
    if (hasAnswered) return;

    if (type === 'multiple') {
      setSelectedIndices(prev => 
        prev.includes(index) ? prev.filter(i => i !== index) : [...prev, index]
      );
    } else {
      setSelectedIndices([index]);
      setHasAnswered(true);
      submitAnswer([index]);
    }
  };

  const handleMultipleSubmit = () => {
    if (selectedIndices.length === 0) return;
    setHasAnswered(true);
    submitAnswer(selectedIndices);
  };

  const submitAnswer = (indices) => {
    socket.emit('student:submit-answer', { roomCode, answerIndices: indices });
    onAnswerSubmitted(indices);
  };

  const timerColor = timeLeft > timeLimit * 0.5 ? 'var(--green)' : timeLeft > timeLimit * 0.25 ? 'var(--yellow)' : 'var(--red)';
  const timerWidth = `${(timeLeft / timeLimit) * 100}%`;

  return (
    <div className="screen bg-black" style={{ justifyContent: 'flex-start' }}>
      <div className="question-timer-track">
        <div className="question-timer-bar" style={{ width: timerWidth, backgroundColor: timerColor }}></div>
      </div>

      <div className="question-header">
        <span className="question-timer-text" style={{ color: timerColor }}>{timeLeft}s</span>
        <span className="question-number-badge">Q{questionIndex + 1}</span>
      </div>

      <div className="question-card animate-slide-down">
        {imageUrl && <img src={imageUrl} alt="Question" className="question-image" />}
        <h2 className="question-text">{text}</h2>
        {type === 'multiple' && <p className="text-muted" style={{ fontSize: 14, marginTop: 8 }}>Select all that apply</p>}
      </div>

      {hasAnswered ? (
        <div className="waiting-badge">✓ Answer locked in!</div>
      ) : (
        type === 'multiple' && (
          <button className="btn-primary" onClick={handleMultipleSubmit} disabled={selectedIndices.length === 0} style={{ marginBottom: 24, maxWidth: 600 }}>
            Submit Answer
          </button>
        )
      )}

      <div className="options-grid">
        {options.map((option, i) => {
          const isSelected = selectedIndices.includes(i);
          const isDimmed = hasAnswered && !isSelected;
          const optionText = option?.text || option;
          const optionImg = option?.imageUrl;

          return (
            <div
              key={i}
              className={`option-btn animate-fade-in-up ${isSelected ? 'option-selected' : ''} ${isDimmed ? 'option-dimmed' : ''}`}
              style={{
                backgroundColor: COLORS[i % COLORS.length],
                animationDelay: `${0.15 + i * 0.08}s`,
                animationFillMode: 'both'
              }}
              onClick={() => handleOptionClick(i)}
            >
              <span className="option-shape">{SHAPES[i % SHAPES.length]}</span>
              {optionImg && <img src={optionImg} alt={`Option ${i+1}`} style={{ maxWidth: '100%', maxHeight: 80, objectFit: 'contain', marginBottom: 8, borderRadius: 8 }} />}
              <span>{optionText}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
