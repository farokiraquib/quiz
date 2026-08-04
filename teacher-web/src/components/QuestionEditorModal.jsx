import React, { useState, useEffect } from 'react';

export default function QuestionEditorModal({
  initialQuestions,
  questionIndex,
  onSave,
  onClose,
}) {
  const [editableQuestions, setEditableQuestions] = useState([...initialQuestions]);

  useEffect(() => {
    setEditableQuestions([...initialQuestions]);
  }, [initialQuestions]);

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

  const handleSave = () => {
    onSave(editableQuestions);
  };

  return (
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
          <button onClick={onClose} className="btn-ghost px-6 py-2.5">Cancel</button>
          <button onClick={handleSave} className="btn-primary px-6 py-2.5">Save Changes</button>
        </div>
      </div>
    </div>
  );
}
