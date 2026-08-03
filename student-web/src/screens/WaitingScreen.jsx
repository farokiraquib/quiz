import React from 'react';

export default function WaitingScreen({ playerName, roomCode }) {
  return (
    <div className="screen">
      <div className="bg-orb waiting-orb-1"></div>
      <div className="bg-orb waiting-orb-2"></div>

      <div className="emoji-large" style={{ animation: 'float 3s ease-in-out infinite' }}>⏳</div>
      <h1 className="title-large" style={{ color: 'var(--green)', textShadow: '0 0 10px var(--green-glow)', animation: 'fadeIn 0.5s ease forwards', animationDelay: '0.1s', opacity: 0 }}>Get Ready!</h1>
      <p className="subtitle" style={{ color: 'var(--green)', animation: 'fadeIn 0.5s ease forwards', animationDelay: '0.2s', opacity: 0 }}>Waiting for the quiz to begin...</p>

      <div className="waiting-dots" style={{ animation: 'fadeInScale 0.5s ease forwards', animationDelay: '0.3s', opacity: 0 }}>
        <div className="waiting-dot"></div>
        <div className="waiting-dot"></div>
        <div className="waiting-dot"></div>
      </div>

      <div className="card" style={{ textAlign: 'center', animation: 'slideUp 0.5s ease forwards', animationDelay: '0.4s', opacity: 0 }}>
        <p className="input-label">Player</p>
        <p style={{ fontSize: 24, fontWeight: 700, marginBottom: 24 }}>{playerName}</p>
        
        <p className="input-label">Room Code</p>
        <p className="join-room-code" style={{ fontSize: 32 }}>{roomCode}</p>
      </div>

      <p style={{ color: 'var(--text-dim)', marginTop: 40, fontWeight: 600, animation: 'fadeIn 0.5s ease forwards', animationDelay: '0.5s', opacity: 0 }}>The teacher will start the quiz shortly</p>
    </div>
  );
}
