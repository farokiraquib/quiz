// Socket.io event handlers for the LiveQuizz game

const {
  createRoom,
  getRoom,
  setRoomField,
  setRoomFields,
  getQuestions,
  addPlayer,
  removePlayer,
  removeRoom,
  findRoomBySocket,
  getActiveRooms,
  markAnswered,
  hasAnswered,
  getAnsweredCount,
  clearAnswered,
  getScore,
  addScore,
  getAllPlayers,
  getPlayerCount,
} = require('./gameState');

const { calculateScore, buildLeaderboard } = require('./leaderboard');
const jwt = require('jsonwebtoken');
const prisma = require('./prisma');
const PLAN_LIMITS = require('./config/plans');
const JWT_SECRET = process.env.JWT_SECRET || 'livequizz-dev-secret-change-in-production';

/**
 * Registers all Socket.io event handlers on the given io instance.
 * @param {import('socket.io').Server} io
 */
function registerHandlers(io) {
  io.on('connection', (socket) => {
    console.log(`[Socket] Connected: ${socket.id}`);

    // ─── 1. HOST: CREATE ROOM ────────────────────────────────────────
    socket.on('host:create-room', async (data, callback) => {
      try {
        if (!data || !Array.isArray(data.questions) || data.questions.length === 0) {
          return callback({ success: false, error: 'Questions array is required' });
        }
        
        if (!data.token) {
          return callback({ success: false, error: 'Authentication required' });
        }

        let decoded;
        try {
          decoded = jwt.verify(data.token, JWT_SECRET);
        } catch (err) {
          return callback({ success: false, error: 'Invalid or expired token' });
        }

        const teacher = await prisma.teacher.findUnique({ where: { id: decoded.id } });
        if (!teacher) {
          return callback({ success: false, error: 'Teacher not found' });
        }

        const planLimits = PLAN_LIMITS[teacher.plan];
        const now = new Date();
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();

        let roomsCreatedThisMonth = teacher.roomsCreatedThisMonth;
        let lastRoomCreatedAt = teacher.lastRoomCreatedAt;

        if (lastRoomCreatedAt) {
          const lastMonth = lastRoomCreatedAt.getMonth();
          const lastYear = lastRoomCreatedAt.getFullYear();
          if (lastMonth !== currentMonth || lastYear !== currentYear) {
            roomsCreatedThisMonth = 0;
          }
        }

        if (planLimits.maxQuizzesPerMonth !== -1 && roomsCreatedThisMonth >= planLimits.maxQuizzesPerMonth) {
          return callback({ success: false, error: `You have reached your limit of ${planLimits.maxQuizzesPerMonth} rooms for this month on the ${teacher.plan} plan. Please upgrade to create more.` });
        }

        // Update usage in DB
        await prisma.teacher.update({
          where: { id: teacher.id },
          data: {
            roomsCreatedThisMonth: roomsCreatedThisMonth + 1,
            lastRoomCreatedAt: now,
          }
        });

        const { code: roomCode, hostSecret } = await createRoom(
          socket.id, 
          data.questions, 
          data.customRoomCode, 
          data.password
        );
        
        // Store teacher plan info in room for students limit check
        await setRoomFields(roomCode, {
          teacherId: teacher.id,
          plan: teacher.plan,
        });

        socket.join(roomCode);

        console.log(`[Room] Created: ${roomCode} by host ${socket.id}`);
        callback({ success: true, roomCode, hostSecret });
      } catch (err) {
        console.error('[host:create-room] Error:', err);
        callback({ success: false, error: 'Failed to create room' });
      }
    });

    // ─── 1.5. HOST: REJOIN ROOM ──────────────────────────────────────
    socket.on('host:rejoin-room', async (data, callback) => {
      try {
        if (!data || !data.roomCode || !data.hostSecret) return callback({ success: false });
        
        const room = await getRoom(data.roomCode);
        if (!room) return callback({ success: false, error: 'Room not found' });
        
        if (room.hostSecret !== data.hostSecret) {
          return callback({ success: false, error: 'Invalid host secret' });
        }

        // Reassign host socket id
        await setRoomField(data.roomCode, 'hostSocketId', socket.id);
        socket.join(data.roomCode);
        
        console.log(`[Room ${data.roomCode}] Host rejoined with socket ${socket.id}`);
        
        const playersMap = await getAllPlayers(data.roomCode);
        const players = Array.from(playersMap.values());
        const questions = await getQuestions(data.roomCode);
        
        callback({ success: true, room: { ...room, players, questions } });
      } catch (err) {
        console.error('[host:rejoin-room] Error:', err);
        callback({ success: false });
      }
    });

    // ─── 1.8. STUDENT: GET ACTIVE ROOMS ───────────────────────────────
    socket.on('student:get-active-rooms', async (callback) => {
      if (typeof callback === 'function') {
        const rooms = await getActiveRooms();
        callback({ success: true, rooms });
      }
    });

    // ─── 2. STUDENT: JOIN ROOM ───────────────────────────────────────
    socket.on('student:join-room', async (data, callback) => {
      try {
        if (!data || !data.roomCode || !data.playerName) {
          return callback({ success: false, error: 'Room code and player name are required' });
        }

        const { roomCode, playerName } = data;
        const room = await getRoom(roomCode);

        if (!room) {
          return callback({ success: false, error: 'Room not found' });
        }

        if (room.password && room.password !== data.password) {
          return callback({ success: false, error: 'Incorrect password' });
        }

        const playerCount = await getPlayerCount(roomCode);
        const plan = room.plan || 'STARTER';
        const planLimits = PLAN_LIMITS[plan];

        if (planLimits.maxStudentsPerRoom !== -1 && playerCount >= planLimits.maxStudentsPerRoom) {
          return callback({ success: false, error: `This room has reached its maximum capacity of ${planLimits.maxStudentsPerRoom} students.` });
        }

        const player = await addPlayer(roomCode, socket.id, playerName);
        if (!player) {
          return callback({ success: false, error: 'Failed to join room' });
        }

        socket.join(roomCode);

        // Notify the room that a new player joined (use playerCount + 1 since we just added one)
        const updatedPlayerCount = playerCount + 1;
        io.to(roomCode).emit('room:player-joined', {
          id: socket.id,
          name: playerName,
          playerCount: updatedPlayerCount,
        });

        console.log(`[Room ${roomCode}] Player joined: ${playerName} (${socket.id}), total: ${playerCount}`);
        
        const questions = await getQuestions(roomCode);
        const imageUrls = [];
        questions.forEach(q => {
          if (q.imageUrl) imageUrls.push(q.imageUrl);
          if (q.options) {
            q.options.forEach(opt => {
              if (opt && opt.imageUrl) imageUrls.push(opt.imageUrl);
            });
          }
        });

        callback({ success: true, roomCode, status: room.status, imageUrls });

        // If game is playing, send the current question to the new student
        if (room.status === 'playing') {
          const question = questions[room.currentQuestionIndex];
          if (question) {
            socket.emit('question:new', {
              questionIndex: room.currentQuestionIndex,
              type: question.type,
              text: question.text,
              imageUrl: question.imageUrl,
              options: question.options,
              timeLimit: question.timeLimit,
              serverStartTime: room.questionStartTime,
            });
          }
        }
      } catch (err) {
        console.error('[student:join-room] Error:', err);
        callback({ success: false, error: 'Failed to join room' });
      }
    });

    // ─── 3. HOST: START QUESTION ─────────────────────────────────────
    socket.on('host:start-question', async (data) => {
      try {
        if (!data || !data.roomCode) return;

        const room = await getRoom(data.roomCode);
        if (!room) return;
        if (room.hostSocketId !== socket.id) return;

        const [questions] = await Promise.all([
          getQuestions(data.roomCode),
          setRoomFields(data.roomCode, {
            status: 'playing',
            questionStartTime: Date.now(),
          }),
          clearAnswered(data.roomCode)
        ]);
        const question = questions[room.currentQuestionIndex];
        if (!question) return;

        // Broadcast question WITHOUT correctIndices
        io.to(data.roomCode).emit('question:new', {
          questionIndex: room.currentQuestionIndex,
          type: question.type,
          text: question.text,
          imageUrl: question.imageUrl,
          options: question.options,
          timeLimit: question.timeLimit,
          serverStartTime: Date.now(),
        });

        console.log(`[Room ${data.roomCode}] Question ${room.currentQuestionIndex + 1}/${questions.length} started`);
      } catch (err) {
        console.error('[host:start-question] Error:', err);
      }
    });

    // ─── 4. STUDENT: SUBMIT ANSWER ───────────────────────────────────
    socket.on('student:submit-answer', async (data, callback) => {
      const safeCallback = typeof callback === 'function' ? callback : () => {};
      try {
        if (!data || !data.roomCode || data.answerIndices === undefined) {
          return safeCallback({ success: false, error: 'Room code and answer indices are required' });
        }

        const { roomCode, answerIndices } = data;
        const room = await getRoom(roomCode);

        if (!room) {
          return safeCallback({ success: false, error: 'Room not found' });
        }

        if (room.status !== 'playing') {
          return safeCallback({ success: false, error: 'Game is not currently active' });
        }

        // Mark as answered (returns 1 if added, 0 if already existed)
        const added = await markAnswered(roomCode, socket.id);
        if (added === 0) {
          return safeCallback({ success: false, error: 'You have already answered this question' });
        }

        // Server-authoritative timing
        const timeTaken = Date.now() - room.questionStartTime;

        const questions = await getQuestions(roomCode);
        const currentQuestion = questions[room.currentQuestionIndex];
        if (!currentQuestion) {
          return safeCallback({ success: false, error: 'No active question' });
        }

        // Calculate accuracy
        const correct = currentQuestion.correctIndices || [currentQuestion.correctIndex];
        const submitted = Array.isArray(answerIndices) ? answerIndices : [answerIndices];

        let correctPicks = 0;
        let wrongPicks = 0;
        submitted.forEach(val => {
          if (correct.includes(val)) correctPicks++;
          else wrongPicks++;
        });
        
        let accuracy = 0;
        if (correct.length > 0) {
          accuracy = Math.max(0, (correctPicks - wrongPicks) / correct.length);
        } else {
          accuracy = submitted.length === 0 ? 1 : 0;
        }

        const maxTimeMs = currentQuestion.timeLimit * 1000;
        const score = calculateScore(accuracy, timeTaken, maxTimeMs);

        const [_, answeredCount, totalPlayers] = await Promise.all([
          addScore(roomCode, socket.id, score),
          getAnsweredCount(roomCode),
          getPlayerCount(roomCode)
        ]);

        // Notify host ONLY with answer count
        io.to(room.hostSocketId).emit('game:answer-received', {
          answeredCount,
          totalPlayers,
        });

        console.log(`[Room ${roomCode}] Answer from ${socket.id}: ${accuracy > 0 ? 'correct' : 'wrong'} (+${score})`);
        safeCallback({ success: true, timeTaken });
      } catch (err) {
        console.error('[student:submit-answer] Error:', err);
        safeCallback({ success: false, error: 'Failed to submit answer' });
      }
    });

    // ─── 5. HOST: END QUESTION ───────────────────────────────────────
    socket.on('host:end-question', async (data) => {
      try {
        if (!data || !data.roomCode) return;

        const room = await getRoom(data.roomCode);
        if (!room) return;
        if (room.hostSocketId !== socket.id) return;

        const [questions, leaderboard] = await Promise.all([
          getQuestions(data.roomCode),
          buildLeaderboard(data.roomCode)
        ]);
        const currentQuestion = questions[room.currentQuestionIndex];
        if (!currentQuestion) return;

        io.to(data.roomCode).emit('question:result', {
          correctIndices: currentQuestion.correctIndices || [currentQuestion.correctIndex],
          leaderboard,
        });

        if (room.currentQuestionIndex >= questions.length - 1) {
          await setRoomField(data.roomCode, 'status', 'finished');
          io.to(data.roomCode).emit('game:finished', { leaderboard });
          console.log(`[Room ${data.roomCode}] Game finished`);
        }

        console.log(`[Room ${data.roomCode}] Question ${room.currentQuestionIndex + 1} ended`);
      } catch (err) {
        console.error('[host:end-question] Error:', err);
      }
    });

    // ─── 6. HOST: NEXT QUESTION ──────────────────────────────────────
    socket.on('host:next-question', async (data) => {
      try {
        if (!data || !data.roomCode) return;

        const room = await getRoom(data.roomCode);
        if (!room) return;
        if (room.hostSocketId !== socket.id) return;

        const nextIndex = room.currentQuestionIndex + 1;
        const [questions] = await Promise.all([
          getQuestions(data.roomCode),
          setRoomField(data.roomCode, 'currentQuestionIndex', nextIndex)
        ]);

        if (nextIndex < questions.length) {
          await Promise.all([
            setRoomFields(data.roomCode, {
              status: 'playing',
              questionStartTime: Date.now(),
            }),
            clearAnswered(data.roomCode)
          ]);

          const question = questions[nextIndex];

          io.to(data.roomCode).emit('question:new', {
            questionIndex: nextIndex,
            type: question.type,
            text: question.text,
            imageUrl: question.imageUrl,
            options: question.options,
            timeLimit: question.timeLimit,
            serverStartTime: Date.now(),
          });

          console.log(`[Room ${data.roomCode}] Question ${nextIndex + 1}/${questions.length} started`);
        } else {
          await setRoomField(data.roomCode, 'status', 'finished');
          const leaderboard = await buildLeaderboard(data.roomCode);
          io.to(data.roomCode).emit('game:finished', { leaderboard });
          console.log(`[Room ${data.roomCode}] Game finished (no more questions)`);
        }
      } catch (err) {
        console.error('[host:next-question] Error:', err);
      }
    });

    // ─── 7. HOST: END GAME ───────────────────────────────────────────
    socket.on('host:end-game', async (data) => {
      try {
        if (!data || !data.roomCode) return;
        const room = await getRoom(data.roomCode);
        if (!room || room.hostSocketId !== socket.id) return;
        
        io.to(data.roomCode).emit('room:host-disconnected', {
          message: 'The host has ended the game.',
        });
        await removeRoom(data.roomCode);
        console.log(`[Room ${data.roomCode}] Game ended by host, room destroyed`);
      } catch (err) {
        console.error('[host:end-game] Error:', err);
      }
    });

    // ─── 8. DISCONNECT ───────────────────────────────────────────────
    socket.on('disconnect', async () => {
      console.log(`[Socket] Disconnected: ${socket.id}`);

      try {
        // Check if this socket was a host
        const roomCode = await findRoomBySocket(socket.id);
        if (!roomCode) return;

        const room = await getRoom(roomCode);
        if (!room) return;

        if (room.hostSocketId === socket.id) {
          io.to(roomCode).emit('room:host-disconnected', {
            message: 'The host has disconnected. Waiting for them to return...',
          });
          console.log(`[Room ${roomCode}] Host disconnected, room kept alive for rejoining`);
        } else {
          // Student disconnected
          const result = await removePlayer(socket.id);
          if (result) {
            io.to(roomCode).emit('room:player-left', {
              name: result.playerName,
              playerCount: result.playerCount,
            });
            console.log(`[Room ${roomCode}] Player left: ${result.playerName}, remaining: ${result.playerCount}`);
          }
        }
      } catch (err) {
        console.error('[disconnect] Error:', err);
      }
    });
  });
}

module.exports = { registerHandlers };
