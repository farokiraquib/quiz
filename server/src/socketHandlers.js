// Socket.io event handlers for the LiveQuizz game

const {
  createRoom,
  getRoom,
  addPlayer,
  removePlayer,
  removeRoom,
  findRoomBySocket,
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
    socket.on('host:create-room', (data, callback) => {
      try {
        if (!data || !Array.isArray(data.questions) || data.questions.length === 0) {
          return callback({ success: false, error: 'Questions array is required' });
        }

        const roomCode = createRoom(socket.id, data.questions);
        socket.join(roomCode);

        console.log(`[Room] Created: ${roomCode} by host ${socket.id}`);
        callback({ success: true, roomCode });
      } catch (err) {
        console.error('[host:create-room] Error:', err);
        callback({ success: false, error: 'Failed to create room' });
      }
    });

    // ─── 2. STUDENT: JOIN ROOM ───────────────────────────────────────
    socket.on('student:join-room', (data, callback) => {
      try {
        if (!data || !data.roomCode || !data.playerName) {
          return callback({ success: false, error: 'Room code and player name are required' });
        }

        const { roomCode, playerName } = data;
        const room = getRoom(roomCode);

        if (!room) {
          return callback({ success: false, error: 'Room not found' });
        }

        if (room.status !== 'lobby') {
          return callback({ success: false, error: 'Game has already started' });
        }

        // Check for duplicate socket joining
        if (room.players.has(socket.id)) {
          return callback({ success: false, error: 'You have already joined this room' });
        }

        const player = addPlayer(roomCode, socket.id, playerName);
        if (!player) {
          return callback({ success: false, error: 'Failed to join room' });
        }

        socket.join(roomCode);

        // Notify the room that a new player joined
        io.to(roomCode).emit('room:player-joined', {
          id: socket.id,
          name: playerName,
          playerCount: room.players.size,
        });

        console.log(`[Room ${roomCode}] Player joined: ${playerName} (${socket.id}), total: ${room.players.size}`);
        callback({ success: true, roomCode });
      } catch (err) {
        console.error('[student:join-room] Error:', err);
        callback({ success: false, error: 'Failed to join room' });
      }
    });

    // ─── 3. HOST: START QUESTION ─────────────────────────────────────
    socket.on('host:start-question', (data) => {
      try {
        if (!data || !data.roomCode) return;

        const room = getRoom(data.roomCode);
        if (!room) return;
        if (room.hostSocketId !== socket.id) return;

        room.status = 'playing';
        room.questionStartTime = Date.now();
        room.answeredSet.clear();

        const question = room.questions[room.currentQuestionIndex];
        if (!question) return;

        // Broadcast question WITHOUT correctIndices
        io.to(data.roomCode).emit('question:new', {
          questionIndex: room.currentQuestionIndex,
          type: question.type,
          text: question.text,
          options: question.options,
          timeLimit: question.timeLimit,
          serverStartTime: room.questionStartTime,
        });

        console.log(`[Room ${data.roomCode}] Question ${room.currentQuestionIndex + 1}/${room.questions.length} started`);
      } catch (err) {
        console.error('[host:start-question] Error:', err);
      }
    });

    // ─── 4. STUDENT: SUBMIT ANSWER ───────────────────────────────────
    socket.on('student:submit-answer', (data, callback) => {
      const safeCallback = typeof callback === 'function' ? callback : () => {};
      try {
        if (!data || !data.roomCode || data.answerIndices === undefined) {
          return safeCallback({ success: false, error: 'Room code and answer indices are required' });
        }

        const { roomCode, answerIndices } = data;
        const room = getRoom(roomCode);

        if (!room) {
          return safeCallback({ success: false, error: 'Room not found' });
        }

        if (room.status !== 'playing') {
          return safeCallback({ success: false, error: 'Game is not currently active' });
        }

        if (!room.players.has(socket.id)) {
          return safeCallback({ success: false, error: 'You are not in this room' });
        }

        // Check if student already answered this question
        if (room.answeredSet.has(socket.id)) {
          return safeCallback({ success: false, error: 'You have already answered this question' });
        }

        // Mark as answered
        room.answeredSet.add(socket.id);

        // Server-authoritative timing
        const timeTaken = Date.now() - room.questionStartTime;

        const currentQuestion = room.questions[room.currentQuestionIndex];
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

        // Add to cumulative score — NO sorting here
        const currentScore = room.scores.get(socket.id) || 0;
        room.scores.set(socket.id, currentScore + score);

        // Notify host ONLY with answer count
        io.to(room.hostSocketId).emit('game:answer-received', {
          answeredCount: room.answeredSet.size,
          totalPlayers: room.players.size,
        });

        console.log(`[Room ${roomCode}] Answer from ${socket.id}: ${isCorrect ? 'correct' : 'wrong'} (+${score})`);
        safeCallback({ success: true, timeTaken });
      } catch (err) {
        console.error('[student:submit-answer] Error:', err);
        safeCallback({ success: false, error: 'Failed to submit answer' });
      }
    });

    // ─── 5. HOST: END QUESTION ───────────────────────────────────────
    socket.on('host:end-question', (data) => {
      try {
        if (!data || !data.roomCode) return;

        const room = getRoom(data.roomCode);
        if (!room) return;
        if (room.hostSocketId !== socket.id) return;

        const currentQuestion = room.questions[room.currentQuestionIndex];
        if (!currentQuestion) return;

        // Build leaderboard — THIS is where sorting happens
        const leaderboard = buildLeaderboard(room);

        io.to(data.roomCode).emit('question:result', {
          correctIndices: currentQuestion.correctIndices || [currentQuestion.correctIndex],
          leaderboard,
        });

        // Check if this was the last question
        if (room.currentQuestionIndex >= room.questions.length - 1) {
          room.status = 'finished';
          io.to(data.roomCode).emit('game:finished', {
            leaderboard,
          });
          console.log(`[Room ${data.roomCode}] Game finished`);
        }

        console.log(`[Room ${data.roomCode}] Question ${room.currentQuestionIndex + 1} ended`);
      } catch (err) {
        console.error('[host:end-question] Error:', err);
      }
    });

    // ─── 6. HOST: NEXT QUESTION ──────────────────────────────────────
    socket.on('host:next-question', (data) => {
      try {
        if (!data || !data.roomCode) return;

        const room = getRoom(data.roomCode);
        if (!room) return;
        if (room.hostSocketId !== socket.id) return;

        room.currentQuestionIndex++;

        if (room.currentQuestionIndex < room.questions.length) {
          // More questions — start the next one
          room.status = 'playing';
          room.questionStartTime = Date.now();
          room.answeredSet.clear();

          const question = room.questions[room.currentQuestionIndex];

          io.to(data.roomCode).emit('question:new', {
            questionIndex: room.currentQuestionIndex,
            type: question.type,
            text: question.text,
            options: question.options,
            timeLimit: question.timeLimit,
            serverStartTime: room.questionStartTime,
          });

          console.log(`[Room ${data.roomCode}] Question ${room.currentQuestionIndex + 1}/${room.questions.length} started`);
        } else {
          // No more questions
          room.status = 'finished';
          const leaderboard = buildLeaderboard(room);

          io.to(data.roomCode).emit('game:finished', {
            leaderboard,
          });

          console.log(`[Room ${data.roomCode}] Game finished (no more questions)`);
        }
      } catch (err) {
        console.error('[host:next-question] Error:', err);
      }
    });

    // ─── 7. DISCONNECT ───────────────────────────────────────────────
    socket.on('disconnect', () => {
      console.log(`[Socket] Disconnected: ${socket.id}`);

      // Check if this socket was a host
      const roomCode = findRoomBySocket(socket.id);
      if (!roomCode) return;

      const room = getRoom(roomCode);
      if (!room) return;

      if (room.hostSocketId === socket.id) {
        // Host disconnected — notify all players and destroy room
        io.to(roomCode).emit('room:host-disconnected', {
          message: 'The host has disconnected. The game has ended.',
        });
        removeRoom(roomCode);
        console.log(`[Room ${roomCode}] Host disconnected, room destroyed`);
      } else {
        // Student disconnected
        const result = removePlayer(socket.id);
        if (result) {
          io.to(roomCode).emit('room:player-left', {
            name: result.playerName,
            playerCount: result.room.players.size,
          });
          console.log(`[Room ${roomCode}] Player left: ${result.playerName}, remaining: ${result.room.players.size}`);
        }
      }
    });
  });
}

module.exports = { registerHandlers };
