import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

import { SERVER_URL } from '../socket';

export default function History({ onBack }) {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      const token = localStorage.getItem('livequizz_token');
      const res = await axios.get(`${SERVER_URL}/api/history`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.success) {
        setHistory(res.data.history);
      } else {
        setError('Failed to fetch history');
      }
    } catch (err) {
      console.error(err);
      setError('Error connecting to server');
    } finally {
      setLoading(false);
    }
  };

  const downloadPDF = (room) => {
    const doc = new jsPDF();
    const date = new Date(room.createdAt).toLocaleDateString();

    doc.setFontSize(20);
    doc.text(`LiveQuizz Room History`, 14, 22);
    
    doc.setFontSize(12);
    doc.text(`Room Code: ${room.roomCode}`, 14, 32);
    doc.text(`Date: ${date}`, 14, 38);
    doc.text(`Total Players: ${room.totalPlayers}`, 14, 44);

    const tableColumn = ["Rank", "Player Name", "Score"];
    const tableRows = [];

    if (Array.isArray(room.leaderboard)) {
      room.leaderboard.forEach((player, index) => {
        const rowData = [
          index + 1,
          player.name,
          player.score
        ];
        tableRows.push(rowData);
      });
    }

    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 50,
      theme: 'grid',
      headStyles: { fillColor: [40, 40, 40] }
    });

    doc.save(`LiveQuizz_Room_${room.roomCode}.pdf`);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-500/10 border border-red-500/50 rounded-xl text-red-400">
        {error}
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto pb-12">
      <div className="mb-8">
        <button 
          onClick={onBack}
          className="mb-4 text-white/50 hover:text-white/80 transition-colors flex items-center gap-2 text-sm font-bold sm:hidden"
        >
          ← Back to Dashboard
        </button>
        <h1 className="text-3xl font-bold text-white mb-2">Room History</h1>
        <p className="text-gray-400">View your past quiz sessions and download reports.</p>
      </div>

      {history.length === 0 ? (
        <div className="text-center p-12 bg-[#0a0a0a] border border-white/10 rounded-2xl">
          <p className="text-gray-400">No history found. Create and finish a room to see it here!</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {history.map((room) => (
            <div key={room.id} className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-6 bg-[#0a0a0a] border border-white/10 rounded-2xl hover:border-white/20 transition-colors">
              <div className="mb-4 sm:mb-0">
                <div className="flex items-center gap-3 mb-1">
                  <h3 className="text-xl font-bold text-white tracking-wider">{room.roomCode}</h3>
                  <span className="text-xs px-2 py-1 bg-white/10 text-white/80 rounded-full">
                    {new Date(room.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <p className="text-gray-400 text-sm">
                  {room.totalPlayers} Players Joined
                </p>
              </div>
              
              <button 
                onClick={() => downloadPDF(room)}
                className="btn-outline flex items-center gap-2 text-sm px-4 py-2"
              >
                <span>📄</span> Download PDF
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
