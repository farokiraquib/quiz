const { io } = require('socket.io-client');

const SERVER_URL = 'http://localhost:3001';
const ROOM_CODE = process.argv[2]; // Pass the room code as an argument
const NUM_CLIENTS = 1000;

if (!ROOM_CODE) {
  console.error('Usage: node load_test.js <ROOM_CODE>');
  process.exit(1);
}

console.log(`Starting load test with ${NUM_CLIENTS} simulated students on room ${ROOM_CODE}...`);

let connectedCount = 0;
let joinedCount = 0;
let answeredCount = 0;
const clients = [];

// Create clients with a small delay to simulate real traffic
for (let i = 0; i < NUM_CLIENTS; i++) {
  setTimeout(() => {
    const socket = io(SERVER_URL, {
      transports: ['websocket'],
      reconnection: false
    });

    socket.on('connect', () => {
      connectedCount++;
      
      // Attempt to join the room
      socket.emit('student:join-room', {
        roomCode: ROOM_CODE,
        playerName: `Bot_Student_${i}`,
      }, (res) => {
        if (res && res.success) {
          joinedCount++;
        } else {
          console.error(`Client ${i} failed to join:`, res?.error);
        }
      });
    });

    socket.on('question:new', (q) => {
      // Simulate taking some time to read the question (1-5 seconds)
      const thinkTime = 1000 + Math.random() * 4000;
      setTimeout(() => {
        // Pick a random answer index (0 to 3)
        const answerIndex = Math.floor(Math.random() * (q.options?.length || 4));
        socket.emit('student:submit-answer', {
          roomCode: ROOM_CODE,
          answerIndices: [answerIndex]
        }, () => {
          answeredCount++;
        });
      }, thinkTime);
    });

    socket.on('disconnect', () => {
      connectedCount--;
    });

    clients.push(socket);
  }, i * 5); // Connect one client every 5ms
}

// Status logger
setInterval(() => {
  console.log(`[Status] Connected: ${connectedCount} | Joined Room: ${joinedCount} | Answers Submitted: ${answeredCount}`);
}, 2000);
