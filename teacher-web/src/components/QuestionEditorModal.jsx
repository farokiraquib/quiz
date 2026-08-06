import React, { useState, useEffect, useCallback } from 'react';
import { SERVER_URL } from '../socket';

const TIME_LIMITS = [10, 15, 20, 30];

const OPTION_STYLES = [
  { bg: 'option-red-ghost', label: 'A', color: '#dc2626' },
  { bg: 'option-blue-ghost', label: 'B', color: '#2563eb' },
  { bg: 'option-amber-ghost', label: 'C', color: '#d97706' },
  { bg: 'option-green-ghost', label: 'D', color: '#16a34a' },
];

function createEmptyQuestion() {
  return {
    type: 'single',
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

export default function QuestionEditorModal({
  initialQuestions,
  questionIndex, // current active question in game
  onSave,
  onClose,
}) {
  const [questions, setQuestions] = useState([]);
  const [selectedQuestionIndex, setSelectedQuestionIndex] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState('');

  // Deep copy initial questions
  useEffect(() => {
    if (initialQuestions && initialQuestions.length > 0) {
      const copy = JSON.parse(JSON.stringify(initialQuestions));
      setQuestions(copy);
      // Start editing the first upcoming question if possible
      const nextUpcoming = questionIndex + 1 < copy.length ? questionIndex + 1 : copy.length - 1;
      setSelectedQuestionIndex(Math.max(0, nextUpcoming));
    }
  }, [initialQuestions, questionIndex]);

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
    setQuestions((prev) => {
      const newQuestions = [...prev, createEmptyQuestion()];
      setSelectedQuestionIndex(newQuestions.length - 1);
      return newQuestions;
    });
  }, []);

  const removeQuestion = useCallback((index) => {
    setQuestions((prev) => {
      const updated = prev.filter((_, i) => i !== index);
      if (selectedQuestionIndex >= updated.length) {
        setSelectedQuestionIndex(Math.max(0, updated.length - 1));
      }
      return updated;
    });
  }, [selectedQuestionIndex]);

  const validate = useCallback(() => {
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      if (!q.text.trim()) return `Question ${i + 1}: Please enter a question`;
      for (let j = 0; j < q.options.length; j++) {
        if (!q.options[j].text.trim() && !q.options[j].imageUrl) {
          return `Question ${i + 1}: Option ${String.fromCharCode(65 + j)} is empty`;
        }
      }
    }
    return '';
  }, [questions]);

  const handleSave = () => {
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }
    setError('');
    onSave(questions);
  };

  const qIndex = selectedQuestionIndex;
  const q = questions[qIndex];
  const isPastOrCurrent = qIndex <= questionIndex;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-0 sm:p-4 z-50">
      <div className="bg-[#0a0a0a] border-0 sm:border border-white/10 sm:rounded-2xl w-full h-full sm:h-auto sm:max-h-[90vh] max-w-6xl flex flex-col md:flex-row overflow-hidden shadow-2xl animate-scale-up">
        
        {/* Sidebar Navigation */}
        <div className="w-full md:w-72 flex flex-col bg-[#050505] border-b md:border-b-0 md:border-r border-white/10 shrink-0">
          <div className="p-4 border-b border-white/10">
            <h2 className="text-lg font-black text-white">Edit Questions</h2>
            <p className="text-xs text-white/40 mt-1">Make live changes to upcoming questions</p>
          </div>

          <div className="p-4 border-b border-white/10">
            <button className="btn-outline w-full justify-center !py-2.5 border-white/20 text-white/80 hover:bg-white/10 transition-colors text-sm" onClick={addQuestion}>
              + Add New Question
            </button>
          </div>

          <div className="p-4 flex-1 md:overflow-y-auto max-h-[25vh] md:max-h-none overflow-y-auto">
            <h2 className="text-[10px] font-bold text-white/30 uppercase tracking-widest mb-3">All Questions</h2>
            <div className="space-y-2">
              {questions.map((questionItem, idx) => {
                const isLocked = idx <= questionIndex;
                return (
                  <button
                    key={idx}
                    onClick={() => setSelectedQuestionIndex(idx)}
                    className={`w-full text-left px-3 py-3 rounded-lg flex items-center justify-between group transition-colors relative overflow-hidden ${
                      idx === selectedQuestionIndex
                        ? 'bg-white/10 text-white'
                        : 'text-white/60 hover:bg-white/5 hover:text-white/90'
                    }`}
                  >
                    {isLocked && idx !== selectedQuestionIndex && (
                      <div className="absolute inset-0 bg-black/20 z-0"></div>
                    )}
                    <div className="flex flex-col overflow-hidden relative z-10 w-full">
                      <div className="flex justify-between items-center mb-0.5">
                        <span className="text-xs font-bold">Question {idx + 1}</span>
                        {isLocked && <span className="text-[9px] font-black uppercase text-white/30 tracking-widest bg-white/5 px-1.5 py-0.5 rounded">Locked</span>}
                      </div>
                      <span className="text-sm truncate w-full pr-6 text-white/40 group-hover:text-white/60">
                        {questionItem.text || 'Empty Question'}
                      </span>
                    </div>
                    {questions.length > 1 && !isLocked && (
                      <span
                        className="text-red-400 opacity-0 md:group-hover:opacity-100 md:opacity-0 opacity-100 transition-opacity hover:bg-red-500/20 p-1.5 rounded absolute right-2 z-20"
                        onClick={(e) => {
                          e.stopPropagation();
                          removeQuestion(idx);
                        }}
                        title="Remove"
                      >
                        ✕
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Main Content Editor */}
        <div className="flex-1 flex flex-col relative md:h-full md:overflow-y-auto">
          {/* Top Bar Actions */}
          <div className="sticky top-0 z-20 bg-black/80 backdrop-blur-md border-b border-white/10 p-3 sm:p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <div className="flex items-center flex-wrap gap-2">
              <span className="text-sm font-bold text-white/50 uppercase">Question {qIndex + 1}</span>
              {isPastOrCurrent && (
                <span className="text-[10px] sm:text-xs font-bold text-red-400 bg-red-400/10 px-2 py-1 rounded">Read Only</span>
              )}
            </div>
            <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto justify-end">
              {error && <span className="text-red-400 text-xs font-medium mr-2">{error}</span>}
              <button className="btn-ghost text-sm px-4 py-2" onClick={onClose}>Cancel</button>
              <button
                className="btn-primary text-sm px-5 py-2"
                onClick={handleSave}
                disabled={isUploading}
              >
                {isUploading ? 'Uploading...' : 'Save Changes'}
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 md:p-8 max-w-4xl mx-auto w-full">
            {q && (
              <div className={`animate-fade-in-up ${isPastOrCurrent ? 'opacity-50 pointer-events-none' : ''}`}>
                {/* Question Setup Controls */}
                <div className="flex flex-wrap gap-4 mb-8 p-4 rounded-xl border border-white/10 bg-white/[0.02]">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold text-white/50 uppercase tracking-wider">Question Type</label>
                    <select
                      value={q.type}
                      onChange={(e) => {
                        const newType = e.target.value;
                        updateQuestion(qIndex, 'type', newType);
                        if (newType === 'single' && q.correctIndices.length > 1) {
                          updateQuestion(qIndex, 'correctIndices', [q.correctIndices[0]]);
                        } else if (q.correctIndices.length === 0) {
                          updateQuestion(qIndex, 'correctIndices', [0]);
                        }
                      }}
                      className="input-field !w-auto text-sm cursor-pointer !py-2"
                    >
                      <option value="single">Single Choice</option>
                      <option value="multiple">Multiple Choice</option>
                    </select>
                  </div>
                  
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold text-white/50 uppercase tracking-wider">Time Limit (sec)</label>
                    <input
                      type="number"
                      min="5"
                      max="300"
                      value={q.timeLimit}
                      onChange={(e) => updateQuestion(qIndex, 'timeLimit', Number(e.target.value))}
                      className="input-field text-sm w-24 text-center !py-2"
                    />
                  </div>
                </div>

                {/* Question Text Input */}
                <div className="mb-8">
                  <textarea
                    value={q.text}
                    onChange={(e) => updateQuestion(qIndex, 'text', e.target.value)}
                    placeholder="Type your question here..."
                    className="w-full bg-transparent border-none outline-none text-2xl md:text-3xl font-bold text-white placeholder-white/20 resize-none min-h-[100px]"
                  />
                  
                  {/* Question Image Handling */}
                  <div className="flex items-center gap-4 mt-2">
                    <input
                      type="file"
                      accept="image/*"
                      id={`modal-question-img-${qIndex}`}
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
                      htmlFor={`modal-question-img-${qIndex}`}
                      className="btn-ghost text-xs cursor-pointer"
                    >
                      {q.imageUrl ? '🖼️ Change Image' : '🖼️ Add Image to Question'}
                    </label>
                    {q.imageUrl && (
                      <div className="relative group/img inline-block">
                        <img src={q.imageUrl} alt="Question" className="h-16 rounded border border-white/10" />
                        <button onClick={() => {
                          updateQuestion(qIndex, 'imageUrl', null);
                          updateQuestion(qIndex, 'imageId', null);
                        }} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs opacity-0 group-hover/img:opacity-100 transition-opacity">✕</button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Options Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {q.options.map((opt, optIndex) => {
                    const isCorrect = q.correctIndices.includes(optIndex);
                    const style = OPTION_STYLES[optIndex];
                    
                    return (
                      <div
                        key={optIndex}
                        className={`relative rounded-xl p-4 transition-all duration-200 border ${
                          isCorrect
                            ? `bg-[var(--${style.bg.replace('-ghost', '')})] border-transparent`
                            : `bg-[#0a0a0a] border-white/10 hover:border-white/20`
                        }`}
                      >
                        <div className="flex gap-3">
                          <button
                            type="button"
                            onClick={() => {
                              if (q.type === 'single') {
                                updateQuestion(qIndex, 'correctIndices', [optIndex]);
                              } else {
                                const newIndices = isCorrect
                                  ? q.correctIndices.filter(i => i !== optIndex)
                                  : [...q.correctIndices, optIndex];
                                if (newIndices.length > 0) updateQuestion(qIndex, 'correctIndices', newIndices);
                              }
                            }}
                            className={`w-8 h-8 rounded shrink-0 flex items-center justify-center font-bold text-sm transition-colors ${
                              isCorrect ? 'bg-white text-black' : 'bg-white/10 text-white hover:bg-white/20'
                            }`}
                          >
                            {isCorrect ? '✓' : style.label}
                          </button>
                          
                          <div className="flex-1 flex flex-col gap-2">
                            <textarea
                              value={opt.text}
                              onChange={(e) => updateOption(qIndex, optIndex, 'text', e.target.value)}
                              placeholder={`Add answer ${style.label}`}
                              className={`w-full bg-transparent border-none outline-none font-semibold text-sm resize-none min-h-[40px] ${
                                isCorrect ? 'text-white placeholder-white/60' : 'text-white placeholder-white/30'
                              }`}
                            />
                            
                            <div className="flex items-center gap-2 mt-auto">
                              <input
                                type="file"
                                accept="image/*"
                                id={`modal-opt-img-${qIndex}-${optIndex}`}
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
                                htmlFor={`modal-opt-img-${qIndex}-${optIndex}`}
                                className={`text-[10px] px-2 py-1 rounded cursor-pointer transition-colors ${
                                  isCorrect ? 'bg-black/20 hover:bg-black/30' : 'bg-white/10 hover:bg-white/20'
                                }`}
                              >
                                {opt.imageUrl ? '🖼️ Change' : '🖼️ Add Image'}
                              </label>
                              {opt.imageUrl && (
                                <div className="relative group/optimg inline-block">
                                  <img src={opt.imageUrl} alt="Opt" className="h-8 rounded" />
                                  <button onClick={() => {
                                    updateOption(qIndex, optIndex, 'imageUrl', null);
                                    updateOption(qIndex, optIndex, 'imageId', null);
                                  }} className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-4 h-4 flex items-center justify-center text-[10px] opacity-0 group-hover/optimg:opacity-100 transition-opacity">✕</button>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
