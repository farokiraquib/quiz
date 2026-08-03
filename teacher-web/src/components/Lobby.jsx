import { useState, useCallback } from 'react';

export default function Lobby({ roomCode, players, onStart, onEndGame }) {
  const [copied, setCopied] = useState(false);
  const [shareCopied, setShareCopied] = useState(false);

  const copyCode = useCallback(() => {
    navigator.clipboard.writeText(roomCode).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, [roomCode]);

  const shareLink = useCallback(() => {
    const url = `${window.location.origin}/?room=${roomCode}`;
    if (navigator.share) {
      navigator.share({
        title: 'Join my LiveQuizz!',
        text: `Join my LiveQuizz room using code: ${roomCode}`,
        url: url
      }).catch(console.error);
    } else {
      navigator.clipboard.writeText(url).then(() => {
        setShareCopied(true);
        setTimeout(() => setShareCopied(false), 2000);
      });
    }
  }, [roomCode]);

  return (
    <div className="screen-enter min-h-screen flex items-center justify-center p-4 md:p-8 bg-[#000000]">
      <div className="max-w-6xl w-full grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-16 items-center">
        
        {/* Left Column: Room Code & Call to Action */}
        <div className="flex flex-col justify-center h-full text-center md:text-left pt-10 md:pt-0">
          <div className="mb-4">
            <span className="inline-block px-3 py-1 rounded-full bg-white/10 text-white/80 text-xs font-bold uppercase tracking-widest mb-6">
              Waiting Room
            </span>
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
              Join the Quiz at <br/><span className="text-white/60">LiveQuizz.com</span>
            </h1>
            <p className="text-white/50 mb-12">Ask your students to go to the website and enter the room code below to join.</p>
          </div>

          <div
            className="inline-block bg-[#0a0a0a] border border-white/20 p-8 rounded-2xl cursor-pointer hover:bg-[#171717] hover:border-white/40 transition-all duration-300 relative group"
            onClick={copyCode}
            title="Click to copy"
          >
            <h2
              className="text-6xl md:text-8xl font-black tracking-widest text-white select-all text-center"
              id="room-code-display"
            >
              {roomCode}
            </h2>
            <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
              <span className="text-sm bg-white text-black px-2 py-1 rounded shadow">Copy</span>
            </div>
          </div>
          
          <div className="h-8 mt-4">
            {copied ? (
              <p className="text-sm font-bold text-green-400 animate-fade-in">
                ✓ Copied to clipboard
              </p>
            ) : (
              <p className="text-sm text-white/40">
                Click the code to copy to clipboard
              </p>
            )}
          </div>
          
          <div className="mt-8 flex flex-wrap gap-4 justify-center md:justify-start">
            <button
              onClick={shareLink}
              className="btn-outline flex items-center gap-2 text-sm px-6 py-2"
            >
              <span className="text-lg">🔗</span>
              {shareCopied ? 'Link Copied!' : 'Share Link'}
            </button>
            {onEndGame && (
              <button
                onClick={() => {
                  if (window.confirm('Are you sure you want to delete this room?')) {
                    onEndGame();
                  }
                }}
                className="btn-outline flex items-center gap-2 text-sm px-6 py-2 border-red-500/30 text-red-400 hover:bg-red-500/10 hover:border-red-500"
              >
                <span className="text-lg">🗑️</span>
                Delete Room
              </button>
            )}
          </div>
        </div>

        {/* Right Column: Player List & Start Button */}
        <div className="flex flex-col h-[500px] md:h-[600px] bg-[#0a0a0a] border border-white/10 rounded-3xl overflow-hidden shadow-2xl relative">
          
          {/* Header */}
          <div className="p-6 border-b border-white/10 bg-black/50 backdrop-blur flex justify-between items-center z-10">
            <h3 className="text-lg font-bold text-white flex items-center gap-3">
              Connected Students
              <span className="bg-white/10 text-white px-3 py-1 rounded-full text-sm">
                {players.length}
              </span>
            </h3>
            <div className="flex gap-2">
              <span className="relative flex h-3 w-3 mt-1.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
              </span>
            </div>
          </div>

          {/* Players Grid */}
          <div className="flex-1 p-6 overflow-y-auto">
            {players.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-white/30">
                <p className="text-lg mb-2">Waiting for students...</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {players.map((player, index) => (
                  <div
                    key={player.id || player.name || index}
                    className="animate-badge-enter px-4 py-3 rounded-xl text-sm font-bold bg-[#171717] border border-white/5 text-white truncate text-center"
                    style={{ animationDelay: `${index * 30}ms` }}
                  >
                    {player.name || player}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer / Action */}
          <div className="p-6 border-t border-white/10 bg-black/50 backdrop-blur z-10">
            <button
              className={`w-full py-4 rounded-xl font-bold text-lg transition-all ${
                players.length < 1 
                  ? 'bg-white/5 text-white/30 cursor-not-allowed border border-white/10' 
                  : 'bg-white text-black hover:bg-gray-200 shadow-lg hover:-translate-y-0.5'
              }`}
              onClick={onStart}
              disabled={players.length < 1}
              id="start-quiz-btn"
            >
              {players.length < 1 ? 'Waiting for players...' : 'Start Quiz Now'}
            </button>
          </div>
        </div>
        
      </div>
    </div>
  );
}
