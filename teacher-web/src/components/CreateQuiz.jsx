import { useState, useCallback } from 'react';
import socket, { SERVER_URL } from '../socket';

const TIME_LIMITS = [10, 15, 20, 30];

const OPTION_STYLES = [
  { bg: 'option-red-ghost', label: 'A', color: '#e74c3c' },
  { bg: 'option-blue-ghost', label: 'B', color: '#3498db' },
  { bg: 'option-amber-ghost', label: 'C', color: '#f39c12' },
  { bg: 'option-green-ghost', label: 'D', color: '#2ecc71' },
];

function createEmptyQuestion() {
  return {
    type: 'single', // 'single' or 'multiple'
    text: '',
    imageUrl: null,
    imageId: null,
    options: [
      { text: '', imageUrl: null, imageId: null },
      { text: '', imageUrl: null, imageId: null },
      { text: '', imageUrl: null, imageId: null },
      { text: '', imageUrl: null, imageId: null },
    ],
    correctIndices: [0],
    timeLimit: 20,
  };
}

export default function CreateQuiz({ onRoomCreated }) {
  const [questions, setQuestions] = useState([createEmptyQuestion()]);
  const [customRoomCode, setCustomRoomCode] = useState('');
  const [password, setPassword] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState('');
  const [isUploading, setIsUploading] = useState(false);

  const updateQuestion = useCallback((index, field, value) => {
    setQuestions((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  }, []);

  const updateOption = useCallback((qIndex, optIndex, field, value) => {
    setQuestions((prev) => {
      const updated = [...prev];
      const q = { ...updated[qIndex] };
      q.options = [...q.options];
      q.options[optIndex] = { ...q.options[optIndex], [field]: value };
      updated[qIndex] = q;
      return updated;
    });
  }, []);

  const handleImageUpload = async (file) => {
    const formData = new FormData();
    formData.append('image', file);
    setIsUploading(true);
    try {
      const res = await fetch(`${SERVER_URL}/upload`, {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      setIsUploading(false);
      if (data.success) {
        return { imageUrl: data.imageUrl, imageId: data.imageId };
      } else {
        throw new Error(data.error);
      }
    } catch (err) {
      setIsUploading(false);
      alert('Failed to upload image');
      return null;
    }
  };

  const addQuestion = useCallback(() => {
    setQuestions((prev) => [...prev, createEmptyQuestion()]);
  }, []);

  const removeQuestion = useCallback((index) => {
    setQuestions((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const validate = useCallback(() => {
    if (customRoomCode && !/^[A-Za-z0-9]+$/.test(customRoomCode)) {
      return 'Room code must be alphanumeric';
    }
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      if (!q.text.trim()) return `Question ${i + 1}: Please enter a question`;
      for (let j = 0; j < q.options.length; j++) {
        if (!q.options[j].text.trim()) return `Question ${i + 1}: Option ${String.fromCharCode(65 + j)} is empty`;
      }
    }
    return '';
  }, [questions, customRoomCode]);

  const handleCreateRoom = useCallback(() => {
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }
    setError('');
    setIsCreating(true);

    const emitCreateRoom = () => {
      const token = localStorage.getItem('livequizz_token');
      socket.emit('host:create-room', { questions, customRoomCode, password, token }, (response) => {
        setIsCreating(false);
        if (response?.success && response?.roomCode) {
          onRoomCreated(response.roomCode, response.hostSecret, questions);
        } else {
          setError(response?.error || 'Failed to create room');
        }
      });
    };

    if (socket.connected) {
      emitCreateRoom();
    } else {
      socket.once('connect', emitCreateRoom);
      socket.connect();
    }

    // Timeout fallback
    setTimeout(() => {
      if (!socket.connected) {
        setIsCreating(false);
        setError('Could not connect to server. Please try again.');
      }
    }, 5000);
  }, [questions, validate, onRoomCreated, customRoomCode, password]);

  return (
    <div className="screen-enter min-h-screen p-4 md:p-8">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="text-center mb-10 animate-fade-in-up">
          <div className="inline-flex items-center justify-center p-3 rounded-2xl bg-white/5 border border-white/10 mb-4 shadow-[0_0_30px_rgba(139,92,246,0.3)]">
            <span className="text-4xl">✨</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-black gradient-text mb-3 tracking-tight">
            Design Your Quiz
          </h1>
          <p className="text-[var(--text-muted)] text-lg font-medium">
            Craft the perfect questions and go live instantly!
          </p>
        </div>

        {/* Room Settings */}
        <div className="glass-card p-6 md:p-8 mb-8 animate-fade-in-up hover:border-[var(--accent-primary)] group">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-[var(--accent-primary-glow)] flex items-center justify-center">
              <span className="text-xl">⚙️</span>
            </div>
            <h2 className="text-xl font-bold text-white group-hover:gradient-text transition-all duration-300">Room Settings</h2>
            <span className="ml-auto text-xs font-bold px-2 py-1 bg-white/10 rounded-md text-white/60">OPTIONAL</span>
          </div>
          <div className="flex flex-col sm:flex-row gap-5">
            <div className="flex-1 space-y-2">
              <label className="text-sm font-semibold text-[var(--text-muted)]">Custom Room Code</label>
              <input
                type="text"
                placeholder="e.g. MATH101"
                value={customRoomCode}
                onChange={(e) => setCustomRoomCode(e.target.value.trim().toUpperCase())}
                className="input-field"
              />
            </div>
            <div className="flex-1 space-y-2">
              <label className="text-sm font-semibold text-[var(--text-muted)]">Room Password</label>
              <input
                type="text"
                placeholder="Leave blank for public"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input-field"
              />
            </div>
          </div>
        </div>

        {/* Questions */}
        <div className="space-y-6">
          {questions.map((q, qIndex) => (
            <div
              key={qIndex}
              className="glass-card p-6 md:p-8 animate-fade-in-up hover:border-[var(--accent-secondary)] group transition-all duration-300"
              style={{ animationDelay: `${qIndex * 80}ms` }}
            >
              {/* Question Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-[var(--accent-secondary-glow)] flex items-center justify-center text-[var(--accent-secondary)] font-black">
                    {qIndex + 1}
                  </div>
                  <span className="text-sm font-bold text-white tracking-wider uppercase group-hover:gradient-text transition-all">
                    Question Setup
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-2 md:gap-3">
                  {/* Question Type */}
                  <select
                    value={q.type}
                    onChange={(e) => {
                      const newType = e.target.value;
                      updateQuestion(qIndex, 'type', newType);
                      // If switching to single, ensure only one correct answer
                      if (newType === 'single' && q.correctIndices.length > 1) {
                        updateQuestion(qIndex, 'correctIndices', [q.correctIndices[0]]);
                      } else if (q.correctIndices.length === 0) {
                        updateQuestion(qIndex, 'correctIndices', [0]);
                      }
                    }}
                    className="input-field !w-auto !py-2 !px-3 text-sm cursor-pointer !bg-white/5 hover:!bg-white/10"
                    aria-label={`Question type for question ${qIndex + 1}`}
                  >
                    <option value="single" style={{ background: '#09090e' }}>Single Choice</option>
                    <option value="multiple" style={{ background: '#09090e' }}>Multiple Choice</option>
                  </select>
                  
                  {/* Time Limit */}
                  <div className="flex items-center bg-white/5 hover:bg-white/10 transition-colors border border-[var(--border-subtle)] rounded-xl px-2 h-[42px]">
                    <span className="text-lg ml-2">⏱️</span>
                    <input
                      type="number"
                      min="5"
                      max="300"
                      value={q.timeLimit}
                      onChange={(e) =>
                        updateQuestion(qIndex, 'timeLimit', Number(e.target.value))
                      }
                      className="bg-transparent text-white w-14 py-2 outline-none text-center font-bold"
                      aria-label={`Time limit for question ${qIndex + 1}`}
                    />
                    <span className="text-sm text-[var(--text-muted)] font-medium pr-2">sec</span>
                  </div>
                  {/* Remove */}
                  {questions.length > 1 && (
                    <button
                      className="btn-danger !p-2 !rounded-xl"
                      onClick={() => removeQuestion(qIndex)}
                      aria-label={`Remove question ${qIndex + 1}`}
                      title="Remove Question"
                    >
                      <span className="text-lg leading-none">🗑️</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Question Text */}
              <div className="flex flex-col gap-3 mb-6">
                <input
                  type="text"
                  value={q.text}
                  onChange={(e) => updateQuestion(qIndex, 'text', e.target.value)}
                  placeholder="Enter your question here..."
                  className="input-field text-xl !py-4 font-semibold shadow-inner"
                  id={`question-text-${qIndex}`}
                />
                
                <div className="flex flex-wrap items-center gap-3">
                  <input
                    type="file"
                    accept="image/*"
                    id={`question-img-${qIndex}`}
                    className="hidden"
                    onChange={async (e) => {
                      if (e.target.files[0]) {
                        const res = await handleImageUpload(e.target.files[0]);
                        if (res) {
                          updateQuestion(qIndex, 'imageUrl', res.imageUrl);
                          updateQuestion(qIndex, 'imageId', res.imageId);
                        }
                      }
                    }}
                  />
                  <label
                    htmlFor={`question-img-${qIndex}`}
                    className="btn-ghost text-xs px-4 py-2 cursor-pointer !rounded-lg hover:!bg-[var(--accent-primary-glow)] hover:!text-[var(--accent-primary)] hover:!border-[var(--accent-primary)]"
                  >
                    {q.imageUrl ? '🖼️ Change Image' : '🖼️ Add Image'}
                  </label>
                  {q.imageUrl && (
                    <div className="relative group/img">
                      <img src={q.imageUrl} alt="Question" className="h-10 rounded-lg shadow-md border border-white/10" />
                      <button onClick={() => {
                        updateQuestion(qIndex, 'imageUrl', null);
                        updateQuestion(qIndex, 'imageId', null);
                      }} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-[10px] opacity-0 group-hover/img:opacity-100 transition-opacity shadow-lg">✕</button>
                    </div>
                  )}
                </div>
              </div>

              {/* Options Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {q.options.map((opt, optIndex) => (
                  <div
                    key={optIndex}
                    className={`relative rounded-2xl p-4 transition-all duration-300 border-2 ${
                      q.correctIndices.includes(optIndex)
                        ? `bg-[var(--${OPTION_STYLES[optIndex].bg.replace('-ghost', '')})] border-transparent shadow-[0_8px_30px_rgba(0,0,0,0.3)] scale-[1.02] z-10`
                        : `${OPTION_STYLES[optIndex].bg} hover:bg-white/5`
                    }`}
                  >
                    <div className="flex items-start gap-4">
                      {/* Correct Answer Selector */}
                      <button
                        type="button"
                        onClick={() => {
                          if (q.type === 'single') {
                            updateQuestion(qIndex, 'correctIndices', [optIndex]);
                          } else {
                            const newIndices = q.correctIndices.includes(optIndex)
                              ? q.correctIndices.filter(i => i !== optIndex)
                              : [...q.correctIndices, optIndex];
                            if (newIndices.length > 0) {
                              updateQuestion(qIndex, 'correctIndices', newIndices);
                            }
                          }
                        }}
                        className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg font-black transition-all duration-300 shrink-0 ${
                          q.correctIndices.includes(optIndex)
                            ? 'bg-white text-gray-900 shadow-xl'
                            : `bg-white/10 text-white/80 hover:bg-white/20 border border-white/20`
                        }`}
                        aria-label={`Mark option ${OPTION_STYLES[optIndex].label} as correct`}
                      >
                        {q.correctIndices.includes(optIndex) ? '✓' : OPTION_STYLES[optIndex].label}
                      </button>
                      <div className="flex-1 flex flex-col gap-2 pt-1">
                        <input
                          type="text"
                          value={opt.text}
                          onChange={(e) =>
                            updateOption(qIndex, optIndex, 'text', e.target.value)
                          }
                          placeholder={`Add answer ${OPTION_STYLES[optIndex].label}`}
                          className={`w-full bg-transparent border-none outline-none font-semibold text-base transition-colors ${
                            q.correctIndices.includes(optIndex) ? 'text-white placeholder-white/70' : 'text-white placeholder-white/40'
                          }`}
                          id={`question-${qIndex}-option-${optIndex}`}
                        />
                        <div className="flex flex-wrap items-center gap-2 mt-1">
                          <input
                            type="file"
                            accept="image/*"
                            id={`opt-img-${qIndex}-${optIndex}`}
                            className="hidden"
                            onChange={async (e) => {
                              if (e.target.files[0]) {
                                const res = await handleImageUpload(e.target.files[0]);
                                if (res) {
                                  updateOption(qIndex, optIndex, 'imageUrl', res.imageUrl);
                                  updateOption(qIndex, optIndex, 'imageId', res.imageId);
                                }
                              }
                            }}
                          />
                          <label
                            htmlFor={`opt-img-${qIndex}-${optIndex}`}
                            className={`text-[11px] px-2.5 py-1.5 cursor-pointer rounded-md font-bold transition-colors ${
                              q.correctIndices.includes(optIndex) 
                                ? 'bg-black/20 hover:bg-black/30 text-white' 
                                : 'bg-white/10 hover:bg-white/20 text-white/80'
                            }`}
                          >
                            {opt.imageUrl ? '🖼️ Change' : '🖼️ Add Image'}
                          </label>
                          {opt.imageUrl && (
                            <div className="relative group/optimg">
                              <img src={opt.imageUrl} alt="Opt" className="h-8 rounded-md shadow-sm" />
                              <button onClick={() => {
                                updateOption(qIndex, optIndex, 'imageUrl', null);
                                updateOption(qIndex, optIndex, 'imageId', null);
                              }} className="absolute -top-1.5 -right-1.5 bg-red-500 text-white rounded-full w-4 h-4 flex items-center justify-center text-[8px] opacity-0 group-hover/optimg:opacity-100 transition-opacity">✕</button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Error Message */}
        {error && (
          <div className="mt-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm text-center animate-fade-in">
            {error}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-8 mb-12 animate-fade-in-up" style={{ animationDelay: '200ms' }}>
          <button className="btn-ghost text-base" onClick={addQuestion}>
            <span className="text-xl leading-none">+</span> Add Question
          </button>
          <button
            className="btn-primary text-base px-10 py-3"
            onClick={handleCreateRoom}
            disabled={isCreating || isUploading}
            id="create-room-btn"
          >
            {isCreating ? (
              <>
                <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Connecting...
              </>
            ) : isUploading ? (
              <>Uploading Images...</>
            ) : (
              <>Create Room</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
