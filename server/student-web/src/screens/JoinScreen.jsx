import React, { useState, useEffect } from 'react';
import socket from '../socket';

export default function JoinScreen({ onJoined }) {
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [isJoining, setIsJoining] = useState(false);
  const [activeRooms, setActiveRooms] = useState([]);

  useEffect(() => {
    socket.connect();
    socket.emit('student:get-active-rooms', (response) => {
      if (response && response.success) {
        setActiveRooms(response.rooms || []);
      }
    });
  }, []);

  const handleJoin = (e) => {
    e?.preventDefault();
    const roomCodeToUse = code;

    if (!name.trim()) {
      alert('Please enter your name');
      return;
    }
    if (!roomCodeToUse || !/^[A-Z0-9]+$/i.test(roomCodeToUse)) {
      alert('Please enter a valid room code');
      return;
    }

    setIsJoining(true);
    socket.connect();
    socket.emit(
      'student:join-room',
      { roomCode: roomCodeToUse.toUpperCase(), playerName: name, password },
      (response) => {
        setIsJoining(false);
        if (response.success) {
          onJoined(name, roomCodeToUse.toUpperCase());
        } else {
          alert(response.error || 'Failed to join room');
          socket.disconnect();
        }
      }
    );
  };

  return (
    <div className="screen">
      <div className="bg-orb join-orb-1"></div>
      <div className="bg-orb join-orb-2"></div>

      <div className="emoji-large" style={{ animation: 'fadeIn 0.5s ease forwards' }}>🎮</div>
      <h1 className="title-large" style={{ animation: 'fadeIn 0.5s ease forwards', animationDelay: '0.1s', opacity: 0 }}>LiveQuizz</h1>
      <p className="subtitle" style={{ animation: 'fadeIn 0.5s ease forwards', animationDelay: '0.2s', opacity: 0 }}>Join the game!</p>

      <div className="card" style={{ animation: 'fadeInScale 0.5s ease forwards', animationDelay: '0.3s', opacity: 0 }}>
        <form onSubmit={handleJoin}>
          <div style={{ marginBottom: 20 }}>
            <label className="input-label">Your Name</label>
            <input
              type="text"
              className="input"
              maxLength={20}
              autoComplete="off"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. John Doe"
            />
          </div>

          <div style={{ marginBottom: 20 }}>
            <label className="input-label">Room Code</label>
            <input
              type="text"
              className="input join-room-input"
              maxLength={10}
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/[^A-Za-z0-9]/g, '').toUpperCase())}
              placeholder="XXXXXX"
            />
          </div>

          <div style={{ marginBottom: 32 }}>
            <label className="input-label">Password (Optional)</label>
            <input
              type="password"
              className="input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="If required"
            />
          </div>

          <button type="submit" className="btn-primary" disabled={isJoining}>
            {isJoining ? 'Joining...' : 'Join Game'}
          </button>
        </form>
      </div>

      {activeRooms.length > 0 && (
        <div className="join-active-rooms" style={{ animation: 'slideUp 0.5s ease forwards', animationDelay: '0.4s', opacity: 0 }}>
          <p className="input-label" style={{ textAlign: 'center', marginTop: 24 }}>Active Rooms</p>
          {activeRooms.map((room) => (
            <div key={room.code} className="join-room-row" onClick={() => setCode(room.code)}>
              <span className="join-room-code">{room.code}</span>
              <span style={{ color: 'var(--text-muted)', fontSize: 14 }}>{room.playerCount} players • {room.status}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
