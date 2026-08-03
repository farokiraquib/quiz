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
    </div>
  );
}
