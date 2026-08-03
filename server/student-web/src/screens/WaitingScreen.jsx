import React from 'react';

export default function WaitingScreen({ playerName, roomCode }) {
  return (
    <div className="screen bg-black">
      <div className="emoji-large animate-fade-in-up">⏳</div>
      <h1 className="title-large animate-fade-in-up" style={{ color: 'var(--green)', animationDelay: '0.1s', animationFillMode: 'both' }}>Session Starting</h1>
      <p className="subtitle animate-fade-in-up" style={{ color: 'var(--green)', animationDelay: '0.2s', animationFillMode: 'both' }}>Please wait for the teacher to begin...</p>

      <div className="waiting-dots animate-fade-in-up" style={{ animationDelay: '0.3s', animationFillMode: 'both' }}>
        <div className="waiting-dot"></div>
        <div className="waiting-dot"></div>
        <div className="waiting-dot"></div>
      </div>

      <div className="card animate-fade-in-up" style={{ textAlign: 'center', animationDelay: '0.4s', animationFillMode: 'both' }}>
        <p className="input-label">Player</p>
        <p style={{ fontSize: 24, fontWeight: 700, marginBottom: 24 }}>{playerName}</p>
        
        <p className="input-label">Room Code</p>
        <p className="join-room-code" style={{ fontSize: 32 }}>{roomCode}</p>
      </div>

      <p className="text-muted animate-fade-in-up" style={{ marginTop: 40, fontWeight: 600, animationDelay: '0.5s', animationFillMode: 'both' }}>The teacher will start the quiz shortly</p>
    </div>
  );
}
