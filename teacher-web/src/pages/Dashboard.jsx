import { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import socket, { SERVER_URL } from '../socket';
import useSocket from '../hooks/useSocket';
import CreateQuiz from '../components/CreateQuiz';
import Lobby from '../components/Lobby';
import GameControl from '../components/GameControl';
import Leaderboard from '../components/Leaderboard';
import { Sparkles, LogOut, User } from 'lucide-react';

export default function Dashboard() {
  const navigate = useNavigate();

  // ── Auth Check ──
  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('livequizz_user'));
    } catch {
      return null;
    }
  });

  const [fullProfile, setFullProfile] = useState(null);
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('livequizz_token');
    if (!token) {
      navigate('/login', { replace: true });
    } else {
      // Fetch full profile
      fetch(`${SERVER_URL}/api/auth/me`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      .then(res => res.json())
      .then(data => {
        if (data.success) setFullProfile(data.user);
      })
      .catch(err => console.error('Failed to fetch profile', err));
    }
  }, [navigate]);

  const handleLogout = useCallback(() => {
    localStorage.removeItem('livequizz_token');
    localStorage.removeItem('livequizz_user');
    navigate('/login');
  }, [navigate]);

  // ── State Machine ──
  const [screen, setScreen] = useState('create'); // 'create' | 'lobby' | 'playing' | 'leaderboard' | 'finished'

  // ── Data State ──
  const [roomCode, setRoomCode] = useState('');
  const [hostSecret, setHostSecret] = useState('');
  const [questions, setQuestions] = useState([]);
  const [players, setPlayers] = useState([]);
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [answeredCount, setAnsweredCount] = useState(0);
  const [leaderboard, setLeaderboard] = useState([]);
  const [isGameOver, setIsGameOver] = useState(false);

  // ── Socket Event Handlers ──

  // Auto-rejoin on mount
  useEffect(() => {
    const savedRoom = localStorage.getItem('livequizz_room');
    const savedSecret = localStorage.getItem('livequizz_secret');
    
    if (savedRoom && savedSecret) {
      socket.connect();
      socket.emit('host:rejoin-room', { roomCode: savedRoom, hostSecret: savedSecret }, (response) => {
        if (response && response.success) {
          setRoomCode(savedRoom);
          setHostSecret(savedSecret);
          setQuestions(response.room.questions);
          
          if (response.room.players) {
             const playersList = Object.values(response.room.players || {});
             setPlayers(playersList);
          }
          
          if (response.room.status === 'playing') {
            setQuestionIndex(response.room.currentQuestionIndex);
            setCurrentQuestion(response.room.questions[response.room.currentQuestionIndex]);
            setScreen('playing');
          } else if (response.room.status === 'finished') {
            setScreen('finished');
          } else {
            setScreen('lobby');
          }
        } else {
          localStorage.removeItem('livequizz_room');
          localStorage.removeItem('livequizz_secret');
        }
      });
    }
  }, []);

  // Player joined (throttled 300ms)
  useSocket(
    'room:player-joined',
    useCallback((data) => {
      setPlayers((prev) => {
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

  const handleRoomCreated = useCallback((code, secret, quizQuestions) => {
    setRoomCode(code);
    setHostSecret(secret);
    setQuestions(quizQuestions);
    setScreen('lobby');
    
    localStorage.setItem('livequizz_room', code);
    localStorage.setItem('livequizz_secret', secret);
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
  }, [roomCode, questionIndex]);

  const handleNextQuestion = useCallback(() => {
    const nextIndex = questionIndex + 1;
    if (nextIndex >= questions.length) {
      socket.emit('host:next-question', { roomCode });
      return;
    }

    const q = questions[nextIndex];
    setCurrentQuestion(q);
    setQuestionIndex(nextIndex);
    setAnsweredCount(0);

    socket.emit('host:next-question', { roomCode });

    setScreen('playing');
  }, [questionIndex, questions, roomCode]);

  const handleLeaveKeepOpen = useCallback(() => {
    socket.disconnect();
    setScreen('create');
    setRoomCode('');
    setHostSecret('');
    setQuestions([]);
    setPlayers([]);
    setCurrentQuestion(null);
    setQuestionIndex(0);
    setAnsweredCount(0);
    setLeaderboard([]);
    setIsGameOver(false);
  }, []);

  const handleEndGame = useCallback(() => {
    socket.emit('host:end-game', { roomCode });
    socket.disconnect();
    localStorage.removeItem('livequizz_room');
    localStorage.removeItem('livequizz_secret');
    setScreen('create');
    setRoomCode('');
    setHostSecret('');
    setQuestions([]);
    setPlayers([]);
    setCurrentQuestion(null);
    setQuestionIndex(0);
    setAnsweredCount(0);
    setLeaderboard([]);
    setIsGameOver(false);
  }, [roomCode]);

  // ── Render ──
  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      {/* Dashboard Navbar */}
      <nav className="sticky top-0 z-50 bg-[#0a0a0a]/80 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-black" />
            </div>
            <span className="text-base font-bold text-white tracking-tight">LiveQuizz</span>
          </div>

          <div className="flex items-center gap-4 relative">
            {user && (
              <div 
                className="hidden sm:flex items-center gap-2 text-sm text-white/50 cursor-pointer hover:bg-white/5 p-1.5 rounded-lg transition-colors"
                onClick={() => setShowProfileMenu(!showProfileMenu)}
              >
                <div className="w-7 h-7 rounded-full bg-white/10 border border-white/10 flex items-center justify-center">
                  <User className="w-3.5 h-3.5 text-white/60" />
                </div>
                <span className="font-medium text-white/70">{user.name || user.email}</span>
              </div>
            )}
            
            {/* Profile Dropdown Menu */}
            {showProfileMenu && fullProfile && (
              <div className="absolute top-12 right-0 w-80 bg-[#163022] border border-white/10 rounded-xl shadow-2xl z-50 animate-fade-in-up overflow-hidden">
                <div className="p-4 border-b border-white/10 bg-black/20">
                  <h3 className="font-bold text-white text-lg">{fullProfile.name}</h3>
                  <p className="text-sm text-white/50">{fullProfile.email}</p>
                </div>
                
                <div className="p-4 space-y-4">
                  {/* Plan Info */}
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-white/60 font-medium">Current Plan</span>
                    <span className="bg-[#fcd34d] text-[#163022] text-xs font-bold px-2 py-1 rounded-md uppercase tracking-wide">
                      {fullProfile.plan.replace('_', ' ')}
                    </span>
                  </div>
                  
                  {/* Validity */}
                  {fullProfile.planExpiresAt && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-white/60 font-medium">Valid Until</span>
                      <span className="text-sm text-white font-semibold">
                        {new Date(fullProfile.planExpiresAt).toLocaleDateString()}
                      </span>
                    </div>
                  )}

                  <hr className="border-white/10" />

                  {/* Usage */}
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-white/40 mb-3">Monthly Usage</h4>
                    
                    <div className="space-y-3">
                      <div>
                        <div className="flex justify-between text-xs mb-1">
                          <span className="text-white/70">Rooms Created</span>
                          <span className="text-white font-mono">
                            {fullProfile.roomsCreatedThisMonth} / {fullProfile.limits.maxQuizzesPerMonth === -1 ? '∞' : fullProfile.limits.maxQuizzesPerMonth}
                          </span>
                        </div>
                        {fullProfile.limits.maxQuizzesPerMonth !== -1 && (
                          <div className="w-full bg-white/10 rounded-full h-1.5">
                            <div 
                              className="bg-yellow-400 h-1.5 rounded-full" 
                              style={{ width: `${(fullProfile.roomsCreatedThisMonth / fullProfile.limits.maxQuizzesPerMonth) * 100}%` }}
                            />
                          </div>
                        )}
                      </div>
                      
                      <div className="flex justify-between text-xs">
                        <span className="text-white/70">Max Students / Room</span>
                        <span className="text-white font-mono">
                          {fullProfile.limits.maxStudentsPerRoom === -1 ? 'Unlimited' : fullProfile.limits.maxStudentsPerRoom}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-2 border-t border-white/10 bg-black/20 flex gap-2">
                  <button
                    onClick={() => navigate('/pricing')}
                    className="flex-1 text-xs font-bold bg-white/10 text-white py-2 rounded-lg hover:bg-white/20 transition-colors"
                  >
                    Upgrade Plan
                  </button>
                  <button
                    onClick={handleLogout}
                    className="flex-1 text-xs font-bold bg-red-500/10 text-red-400 py-2 rounded-lg hover:bg-red-500/20 transition-colors"
                  >
                    Log Out
                  </button>
                </div>
              </div>
            )}

            {!user && (
              <button
                onClick={handleLogout}
                className="inline-flex items-center gap-2 text-sm text-white/40 hover:text-white/70 transition-colors duration-200 px-3 py-1.5 rounded-lg hover:bg-white/5"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">Log Out</span>
              </button>
            )}
          </div>
        </div>
      </nav>

      {/* Content */}
      <div>
        {screen === 'create' && (
          <CreateQuiz onRoomCreated={handleRoomCreated} />
        )}

        {screen === 'lobby' && (
          <Lobby
            roomCode={roomCode}
            players={players}
            onStart={handleStartQuiz}
            onLeaveKeepOpen={handleLeaveKeepOpen}
            onEndGame={handleEndGame}
          />
        )}

        {screen === 'playing' && (
          <GameControl
            roomCode={roomCode}
            hostSecret={hostSecret}
            questions={questions}
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
            onBackHome={handleEndGame}
          />
        )}
      </div>
    </div>
  );
}
