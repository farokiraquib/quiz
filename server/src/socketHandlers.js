// Socket.io event handlers for the LiveQuizz game

const {
  createRoom,
  getRoom,
  setRoomField,
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
} = require('./gameState');

const { calculateScore, buildLeaderboard } = require('./leaderboard');

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

        const { code: roomCode, hostSecret } = await createRoom(
          socket.id, 
          data.questions, 
          data.customRoomCode, 
          data.password
        );
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

        const player = await addPlayer(roomCode, socket.id, playerName);
        if (!player) {
          return callback({ success: false, error: 'Failed to join room' });
        }

        socket.join(roomCode);

        const playersMap = await getAllPlayers(roomCode);

        // Notify the room that a new player joined
        io.to(roomCode).emit('room:player-joined', {
          id: socket.id,
          name: playerName,
          playerCount: playersMap.size,
        });

        console.log(`[Room ${roomCode}] Player joined: ${playerName} (${socket.id}), total: ${playersMap.size}`);
        
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

        await setRoomField(data.roomCode, 'status', 'playing');
        await setRoomField(data.roomCode, 'questionStartTime', Date.now());
        await clearAnswered(data.roomCode);

        const questions = await getQuestions(data.roomCode);
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

        const alreadyAnswered = await hasAnswered(roomCode, socket.id);
        if (alreadyAnswered) {
          return safeCallback({ success: false, error: 'You have already answered this question' });
        }

        // Mark as answered
        await markAnswered(roomCode, socket.id);

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

        await addScore(roomCode, socket.id, score);

        const answeredCount = await getAnsweredCount(roomCode);
        const playersMap = await getAllPlayers(roomCode);

        // Notify host ONLY with answer count
        io.to(room.hostSocketId).emit('game:answer-received', {
          answeredCount,
          totalPlayers: playersMap.size,
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

        const questions = await getQuestions(data.roomCode);
        const currentQuestion = questions[room.currentQuestionIndex];
        if (!currentQuestion) return;

        const leaderboard = await buildLeaderboard(data.roomCode);

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
        await setRoomField(data.roomCode, 'currentQuestionIndex', nextIndex);

        const questions = await getQuestions(data.roomCode);

        if (nextIndex < questions.length) {
          await setRoomField(data.roomCode, 'status', 'playing');
          await setRoomField(data.roomCode, 'questionStartTime', Date.now());
          await clearAnswered(data.roomCode);

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
