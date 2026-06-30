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

    socket.connect();

    socket.once('connect', () => {
      const token = localStorage.getItem('livequizz_token');
      socket.emit('host:create-room', { questions, customRoomCode, password, token }, (response) => {
        setIsCreating(false);
        if (response?.roomCode) {
          onRoomCreated(response.roomCode, response.hostSecret, questions);
        } else {
          setError(response?.error || 'Failed to create room');
        }
      });
    });

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
        <div className="text-center mb-8 animate-fade-in-up">
          <h1 className="text-4xl md:text-5xl font-semibold text-[var(--text-primary)] mb-2 tracking-tight">
            LiveQuizz
          </h1>
          <p className="text-[var(--text-muted)] text-lg">
            Create your quiz and host a live session
          </p>
        </div>

        {/* Room Settings */}
        <div className="glass-card p-5 md:p-6 mb-6 animate-fade-in-up">
          <h2 className="text-lg font-semibold text-white mb-4">Room Settings (Optional)</h2>
          <div className="flex flex-col sm:flex-row gap-4">
            <input
              type="text"
              placeholder="Custom Room Code"
              value={customRoomCode}
              onChange={(e) => setCustomRoomCode(e.target.value.trim().toUpperCase())}
              className="input-field flex-1"
            />
            <input
              type="text"
              placeholder="Room Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input-field flex-1"
            />
          </div>
        </div>

        {/* Questions */}
        <div className="space-y-6">
          {questions.map((q, qIndex) => (
            <div
              key={qIndex}
              className="glass-card p-5 md:p-6 animate-fade-in-up"
              style={{ animationDelay: `${qIndex * 80}ms` }}
            >
              {/* Question Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                <span className="text-sm font-semibold text-[var(--text-muted)] tracking-wider uppercase">
                  Question {qIndex + 1}
                </span>
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
                    className="input-field !w-auto !py-2 !px-3 text-sm cursor-pointer"
                    aria-label={`Question type for question ${qIndex + 1}`}
                  >
                    <option value="single" style={{ background: '#0a0a0a' }}>Single Choice</option>
                    <option value="multiple" style={{ background: '#0a0a0a' }}>Multiple Choice</option>
                  </select>
                  
                  {/* Time Limit */}
                  <div className="flex items-center bg-[#0a0a0a] border border-[var(--border-subtle)] rounded-md px-2">
                    <input
                      type="number"
                      min="5"
                      max="300"
                      value={q.timeLimit}
                      onChange={(e) =>
                        updateQuestion(qIndex, 'timeLimit', Number(e.target.value))
                      }
                      className="bg-transparent text-white w-12 py-2 outline-none text-center text-sm"
                      aria-label={`Time limit for question ${qIndex + 1}`}
                    />
                    <span className="text-sm text-[var(--text-muted)]">s</span>
                  </div>
                  {/* Remove */}
                  {questions.length > 1 && (
                    <button
                      className="btn-danger"
                      onClick={() => removeQuestion(qIndex)}
                      aria-label={`Remove question ${qIndex + 1}`}
                    >
                      ✕ Remove
                    </button>
                  )}
                </div>
              </div>

              {/* Question Text */}
              <div className="flex flex-col gap-2 mb-4">
                <input
                  type="text"
                  value={q.text}
                  onChange={(e) => updateQuestion(qIndex, 'text', e.target.value)}
                  placeholder="Enter your question..."
                  className="input-field text-lg !py-3"
                  id={`question-text-${qIndex}`}
                />
                
                <div className="flex flex-wrap items-center gap-2">
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
                    className="btn-ghost text-xs px-3 py-1 cursor-pointer"
                  >
                    {q.imageUrl ? 'Change Image' : '+ Add Image'}
                  </label>
                  {q.imageUrl && (
                    <img src={q.imageUrl} alt="Question" className="h-8 rounded" />
                  )}
                  {q.imageUrl && (
                    <button onClick={() => {
                      updateQuestion(qIndex, 'imageUrl', null);
                      updateQuestion(qIndex, 'imageId', null);
                    }} className="text-red-400 text-xs">Remove</button>
                  )}
                </div>
              </div>

              {/* Options Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {q.options.map((opt, optIndex) => (
                  <div
                    key={optIndex}
                    className={`relative rounded-xl p-3 transition-all duration-200 ${OPTION_STYLES[optIndex].bg} ${
                      q.correctIndices.includes(optIndex)
                        ? 'ring-2 ring-white/30 shadow-lg'
                        : ''
                    }`}
                  >
                    <div className="flex items-center gap-3">
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
                        className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-200 shrink-0 ${
                          q.correctIndices.includes(optIndex)
                            ? 'bg-white text-gray-900 shadow-md scale-110'
                            : 'bg-white/10 text-white/60 hover:bg-white/20'
                        }`}
                        aria-label={`Mark option ${OPTION_STYLES[optIndex].label} as correct for question ${qIndex + 1}`}
                        title={
                          q.correctIndices.includes(optIndex)
                            ? 'Correct answer'
                            : 'Set as correct'
                        }
                      >
                        {q.correctIndices.includes(optIndex) ? '✓' : OPTION_STYLES[optIndex].label}
                      </button>
                      <div className="flex-1 flex flex-col gap-1">
                        <input
                          type="text"
                          value={opt.text}
                          onChange={(e) =>
                            updateOption(qIndex, optIndex, 'text', e.target.value)
                          }
                          placeholder={`Option ${OPTION_STYLES[optIndex].label}`}
                          className="w-full bg-transparent border-none outline-none text-white placeholder-white/40 text-sm"
                          id={`question-${qIndex}-option-${optIndex}`}
                        />
                        <div className="flex flex-wrap items-center gap-2">
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
                            className="btn-ghost text-[10px] px-2 py-1 cursor-pointer"
                          >
                            {opt.imageUrl ? 'Change Img' : '+ Img'}
                          </label>
                          {opt.imageUrl && (
                            <img src={opt.imageUrl} alt="Opt" className="h-4 rounded" />
                          )}
                          {opt.imageUrl && (
                            <button onClick={() => {
                              updateOption(qIndex, optIndex, 'imageUrl', null);
                              updateOption(qIndex, optIndex, 'imageId', null);
                            }} className="text-red-400 text-[10px]">✕</button>
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
