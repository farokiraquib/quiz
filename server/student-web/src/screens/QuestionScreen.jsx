import React, { useState, useEffect } from 'react';
import { TransformWrapper, TransformComponent } from 'react-zoom-pan-pinch';

const COLORS = ['var(--option-a)', 'var(--option-b)', 'var(--option-c)', 'var(--option-d)'];
const SHAPES = ['▲', '◆', '●', '■'];

export default function QuestionScreen({ question, roomCode, onAnswerSubmitted, socket }) {
  const { questionIndex, text, imageUrl, options, timeLimit, serverStartTime, type } = question;
  
  const [timeLeft, setTimeLeft] = useState(timeLimit);
  const [hasAnswered, setHasAnswered] = useState(false);
  const [selectedIndices, setSelectedIndices] = useState([]);
  const [zoomedImage, setZoomedImage] = useState(null);

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
        {imageUrl && (
          <div 
            onClick={() => setZoomedImage(imageUrl)}
            style={{ position: 'relative', display: 'inline-block', cursor: 'zoom-in', marginBottom: '16px' }}
          >
            <img src={imageUrl} alt="Question" className="question-image" style={{ marginBottom: 0 }} />
            <div style={{ position: 'absolute', top: 8, right: 8, background: 'rgba(0,0,0,0.7)', padding: '6px', borderRadius: '6px', display: 'flex' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8"></circle>
                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                <line x1="11" y1="8" x2="11" y2="14"></line>
                <line x1="8" y1="11" x2="14" y2="11"></line>
              </svg>
            </div>
          </div>
        )}
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
              {optionImg && (
                <div 
                  onClick={(e) => { e.stopPropagation(); setZoomedImage(optionImg); }}
                  style={{ position: 'relative', display: 'inline-block', cursor: 'zoom-in', marginBottom: 8, maxWidth: '100%' }}
                >
                  <img src={optionImg} alt={`Option ${i+1}`} style={{ maxWidth: '100%', maxHeight: 80, objectFit: 'contain', borderRadius: 8, display: 'block' }} />
                  <div style={{ position: 'absolute', top: 4, right: 4, background: 'rgba(0,0,0,0.7)', padding: '4px', borderRadius: '4px', display: 'flex' }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="11" cy="11" r="8"></circle>
                      <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                      <line x1="11" y1="8" x2="11" y2="14"></line>
                      <line x1="8" y1="11" x2="14" y2="11"></line>
                    </svg>
                  </div>
                </div>
              )}
              <span>{optionText}</span>
            </div>
          );
        })}
      </div>

      {zoomedImage && (
        <div 
          style={{ position: 'fixed', inset: 0, zIndex: 999999, backgroundColor: 'rgba(0,0,0,0.95)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        >
          <TransformWrapper
            initialScale={1}
            minScale={1}
            maxScale={8}
            centerOnInit
            wheel={{ step: 0.1 }}
            pinch={{ step: 5 }}
            doubleClick={{ disabled: false, step: 2 }}
          >
            {({ zoomIn, zoomOut, resetTransform }) => (
              <React.Fragment>
                <div style={{ position: 'absolute', top: 20, left: 20, zIndex: 1000000, display: 'flex', gap: 12 }}>
                  <button onClick={() => zoomIn()} style={{ background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.3)', color: 'white', padding: '8px 12px', borderRadius: 8, cursor: 'pointer', fontWeight: 'bold' }}>+</button>
                  <button onClick={() => zoomOut()} style={{ background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.3)', color: 'white', padding: '8px 12px', borderRadius: 8, cursor: 'pointer', fontWeight: 'bold' }}>-</button>
                  <button onClick={() => resetTransform()} style={{ background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.3)', color: 'white', padding: '8px 12px', borderRadius: 8, cursor: 'pointer', fontWeight: 'bold' }}>Reset</button>
                </div>
                <TransformComponent wrapperStyle={{ width: '100vw', height: '100vh' }}>
                  <img src={zoomedImage} alt="Zoomed" style={{ width: '100vw', height: '100vh', objectFit: 'contain', pointerEvents: 'auto' }} />
                </TransformComponent>
              </React.Fragment>
            )}
          </TransformWrapper>
          <button 
            style={{ position: 'absolute', top: 20, right: 20, zIndex: 1000000, background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.3)', color: 'white', padding: '8px 16px', borderRadius: 8, cursor: 'pointer', fontSize: 14, fontWeight: 'bold' }}
            onClick={(e) => { e.stopPropagation(); setZoomedImage(null); }}
          >
            ✕ Close
          </button>
        </div>
      )}
    </div>
  );
}
