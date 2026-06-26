import { useState, useCallback } from 'react';
import socket from './socket';
import useSocket from './hooks/useSocket';
import CreateQuiz from './components/CreateQuiz';
import Lobby from './components/Lobby';
import GameControl from './components/GameControl';
import Leaderboard from './components/Leaderboard';

export default function App() {
  // ── State Machine ──
  const [screen, setScreen] = useState('create'); // 'create' | 'lobby' | 'playing' | 'leaderboard' | 'finished'

  // ── Data State ──
  const [roomCode, setRoomCode] = useState('');
  const [questions, setQuestions] = useState([]);
  const [players, setPlayers] = useState([]);
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [answeredCount, setAnsweredCount] = useState(0);
  const [leaderboard, setLeaderboard] = useState([]);
  const [isGameOver, setIsGameOver] = useState(false);

  // ── Socket Event Handlers ──

  // Player joined (throttled 300ms)
  useSocket(
    'room:player-joined',
    useCallback((data) => {
      setPlayers((prev) => {
        // Avoid duplicates
        if (prev.some((p) => p.id === data.id)) return prev;
        return [...prev, data];
      });
    }, []),
    300
  );

  // Player left
  useSocket(
    'room:player-left',
    useCallback((data) => {
      setPlayers((prev) => prev.filter((p) => p.name !== data.name));
    }, [])
  );

  // Answer received (throttled 200ms)
  useSocket(
    'game:answer-received',
    useCallback((data) => {
      setAnsweredCount(data.answeredCount ?? ((prev) => prev + 1));
    }, []),
    200
  );

  // Question result → show leaderboard
  useSocket(
    'question:result',
    useCallback((data) => {
      setLeaderboard(data.leaderboard || []);
      setScreen('leaderboard');
    }, [])
  );

  // Game finished
  useSocket(
    'game:finished',
    useCallback((data) => {
      setLeaderboard(data.leaderboard || []);
      setIsGameOver(true);
      setScreen('finished');
    }, [])
  );

  // ── Action Handlers ──

  const handleRoomCreated = useCallback((code, quizQuestions) => {
    setRoomCode(code);
    setQuestions(quizQuestions);
    setScreen('lobby');
  }, []);

  const handleStartQuiz = useCallback(() => {
    if (questions.length === 0) return;
    const q = questions[0];
    setCurrentQuestion(q);
    setQuestionIndex(0);
    setAnsweredCount(0);

    socket.emit('host:start-question', {
      roomCode,
      questionIndex: 0,
      question: q,
    });

    setScreen('playing');
  }, [questions, roomCode]);

  const handleEndQuestion = useCallback(() => {
    socket.emit('host:end-question', {
      roomCode,
      questionIndex,
    });
    // Server will respond with question:result
  }, [roomCode, questionIndex]);

  const handleNextQuestion = useCallback(() => {
    const nextIndex = questionIndex + 1;
    if (nextIndex >= questions.length) {
      // This was the last question — server should emit game:finished
      socket.emit('host:next-question', { roomCode });
      return;
    }

    const q = questions[nextIndex];
    setCurrentQuestion(q);
    setQuestionIndex(nextIndex);
    setAnsweredCount(0);

    // Let server handle index tracking and broadcasting
    socket.emit('host:next-question', { roomCode });

    setScreen('playing');
  }, [questionIndex, questions, roomCode]);

  const handleBackHome = useCallback(() => {
    socket.disconnect();
    setScreen('create');
    setRoomCode('');
    setQuestions([]);
    setPlayers([]);
    setCurrentQuestion(null);
    setQuestionIndex(0);
    setAnsweredCount(0);
    setLeaderboard([]);
    setIsGameOver(false);
  }, []);

  // ── Render ──
  return (
    <div className="min-h-screen">
      {screen === 'create' && (
        <CreateQuiz onRoomCreated={handleRoomCreated} />
      )}

      {screen === 'lobby' && (
        <Lobby
          roomCode={roomCode}
          players={players}
          onStart={handleStartQuiz}
        />
      )}

      {screen === 'playing' && (
        <GameControl
          question={currentQuestion}
          questionIndex={questionIndex}
          totalQuestions={questions.length}
          answeredCount={answeredCount}
          totalPlayers={players.length}
          timeLimit={currentQuestion?.timeLimit || 20}
          onEndQuestion={handleEndQuestion}
        />
      )}

      {(screen === 'leaderboard' || screen === 'finished') && (
        <Leaderboard
          leaderboard={leaderboard}
          isGameOver={isGameOver || screen === 'finished'}
          onNextQuestion={handleNextQuestion}
          onBackHome={handleBackHome}
        />
      )}
    </div>
  );
}
