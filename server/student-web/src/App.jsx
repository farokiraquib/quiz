import React, { useState, useEffect } from 'react';
import socket from './socket';
import JoinScreen from './screens/JoinScreen';
import WaitingScreen from './screens/WaitingScreen';
import QuestionScreen from './screens/QuestionScreen';
import ResultScreen from './screens/ResultScreen';
import GameOverScreen from './screens/GameOverScreen';

export default function App() {
  const [screen, setScreen] = useState('join');
  const [playerName, setPlayerName] = useState('');
  const [roomCode, setRoomCode] = useState('');
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [selectedAnswer, setSelectedAnswer] = useState([]);
  const [questionResult, setQuestionResult] = useState(null);
  const [finalLeaderboard, setFinalLeaderboard] = useState([]);
  const [transitioning, setTransitioning] = useState(false);

  const transitionTo = (newScreen) => {
    setTransitioning(true);
    setTimeout(() => {
      setScreen(newScreen);
      setTimeout(() => setTransitioning(false), 150);
    }, 150);
  };

  useEffect(() => {
    socket.on('question:new', (data) => {
      setCurrentQuestion(data);
      setSelectedAnswer([]);
      setQuestionResult(null);
      transitionTo('question');
    });

    socket.on('question:result', (data) => {
      setQuestionResult(data);
      transitionTo('result');
    });

    socket.on('game:finished', (data) => {
      setFinalLeaderboard(data.leaderboard);
      transitionTo('gameover');
    });

    socket.on('room:host-disconnected', () => {
      alert('Host Disconnected - The teacher has left the game. Returning to join screen.');
      resetToJoin();
    });

    socket.on('disconnect', (reason) => {
      if (reason !== 'io client disconnect') {
        alert('Disconnected - Lost connection to the server. Please rejoin.');
        resetToJoin();
      }
    });

    return () => {
      socket.off('question:new');
      socket.off('question:result');
      socket.off('game:finished');
      socket.off('room:host-disconnected');
      socket.off('disconnect');
    };
  }, []);

  // PWA Install Prompt Logic
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);
  const [dontAskAgain, setDontAskAgain] = useState(false);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      
      const hideForever = localStorage.getItem('livequizz_hide_install_prompt');
      
      // Show prompt if not already installed/standalone and hasn't chosen "Don't show again"
      if (!window.matchMedia('(display-mode: standalone)').matches && hideForever !== 'true') {
        setShowInstallPrompt(true);
      }
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      setShowInstallPrompt(false);
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      console.log(`Install prompt outcome: ${outcome}`);
      setDeferredPrompt(null);
    }
  };

  const handleDismissInstall = () => {
    if (dontAskAgain) {
      localStorage.setItem('livequizz_hide_install_prompt', 'true');
    }
    setShowInstallPrompt(false);
  };

  const resetToJoin = () => {
    socket.disconnect();
    setPlayerName('');
    setRoomCode('');
    setCurrentQuestion(null);
    setSelectedAnswer([]);
    setQuestionResult(null);
    setFinalLeaderboard([]);
    transitionTo('join');
  };

  const handleJoined = (name, code) => {
    setPlayerName(name);
    setRoomCode(code);
    transitionTo('waiting');
  };

  const handleAnswerSubmitted = (answerIndices) => {
    setSelectedAnswer(answerIndices);
  };

  return (
    <div className={`app-root ${transitioning ? 'fade-out' : ''}`}>
      {screen === 'join' && <JoinScreen onJoined={handleJoined} />}
      {screen === 'waiting' && <WaitingScreen playerName={playerName} roomCode={roomCode} />}
      {screen === 'question' && (
        <QuestionScreen
          question={currentQuestion}
          roomCode={roomCode}
          onAnswerSubmitted={handleAnswerSubmitted}
          socket={socket}
        />
      )}
      {screen === 'result' && (
        <ResultScreen
          questionResult={questionResult}
          selectedAnswer={selectedAnswer}
          socketId={socket.id}
          question={currentQuestion}
        />
      )}
      {screen === 'gameover' && (
        <GameOverScreen
          finalLeaderboard={finalLeaderboard}
          socketId={socket.id}
          playerName={playerName}
          onPlayAgain={resetToJoin}
        />
      )}

      {/* PWA Install Banner */}
      {showInstallPrompt && (
        <div className="pwa-install-banner">
          <div className="pwa-install-header">
            <div className="pwa-install-text">
              <span className="pwa-install-title">Install LiveQuizz</span>
              <span className="pwa-install-desc">Add to home screen for faster access</span>
            </div>
            <div className="pwa-install-actions">
              <button onClick={handleDismissInstall} className="pwa-btn-later">Later</button>
              <button onClick={handleInstallClick} className="pwa-btn-install">Install</button>
            </div>
          </div>
          <div className="pwa-install-footer">
            <label className="pwa-checkbox-label">
              <input 
                type="checkbox" 
                checked={dontAskAgain}
                onChange={(e) => setDontAskAgain(e.target.checked)}
              />
              Don't show this again
            </label>
          </div>
        </div>
      )}
    </div>
  );
}
