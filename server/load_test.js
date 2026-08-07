const { io } = require('socket.io-client');

// Command line arguments
const args = process.argv.slice(2);
const ROOM_CODE = args[0];
const NUM_CLIENTS = parseInt(args[1]) || 100;
const SERVER_URL = args[2] || 'http://localhost:3001';

if (!ROOM_CODE) {
  console.error('Usage: node load_test.js <ROOM_CODE> [NUM_CLIENTS] [SERVER_URL]');
  console.error('Example: node load_test.js ABCDEF 500 https://your-render-url.onrender.com');
  process.exit(1);
}

console.log(`====================================================`);
console.log(`🚀 Starting Socket.io Load Test`);
console.log(`Server URL:   ${SERVER_URL}`);
console.log(`Room Code:    ${ROOM_CODE}`);
console.log(`Simulated:    ${NUM_CLIENTS} students`);
console.log(`====================================================`);

let connectedCount = 0;
let joinedCount = 0;
let answeredCount = 0;
let disconnectCount = 0;
let errorCount = 0;
let lastErrorMessage = 'None';

const clients = [];

// Stagger connections to avoid overwhelming the OS / Network at once
const CONNECTION_DELAY = 10; // ms between connections

for (let i = 0; i < NUM_CLIENTS; i++) {
  setTimeout(() => {
    const socket = io(SERVER_URL, {
      transports: ['websocket', 'polling'], // Try websocket first, fallback to polling
      reconnection: false,
      timeout: 10000,
    });

    let joinStart = Date.now();

    socket.on('connect', () => {
      connectedCount++;
      
      // Attempt to join the room
      socket.emit('student:join-room', {
        roomCode: ROOM_CODE,
        playerName: `Bot_${Math.floor(Math.random() * 10000)}_${i}`,
      }, (res) => {
        if (res && res.success) {
          joinedCount++;
        } else {
          errorCount++;
          lastErrorMessage = res?.error || 'Join rejected (no error message)';
        }
      });
    });

    socket.on('connect_error', (err) => {
      errorCount++;
      lastErrorMessage = `Connection error: ${err.message}`;
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

    socket.on('disconnect', (reason) => {
      connectedCount--;
      disconnectCount++;
    });

    clients.push(socket);
  }, i * CONNECTION_DELAY);
}

// Status logger
let lastAnsweredCount = 0;
let maxAps = 0;

const interval = setInterval(() => {
  const currentAnswered = answeredCount;
  const aps = (currentAnswered - lastAnsweredCount) / 2; // Divided by 2 because interval is 2s
  lastAnsweredCount = currentAnswered;

  if (aps > maxAps) {
    maxAps = aps;
  }

  console.clear();
  console.log(`====================================================`);
  console.log(`🚀 Live Load Test Status`);
  console.log(`Server URL:   ${SERVER_URL}`);
  console.log(`Room Code:    ${ROOM_CODE}`);
  console.log(`Target Users: ${NUM_CLIENTS}`);
  console.log(`====================================================`);
  console.log(`🟢 Connected:       ${connectedCount}`);
  console.log(`✅ Joined Room:     ${joinedCount}`);
  console.log(`📝 Total Answers:   ${answeredCount}`);
  console.log(`⚡ Answers/sec:     ${aps.toFixed(1)} (Peak: ${maxAps.toFixed(1)}/s)`);
  console.log(`❌ Errors:          ${errorCount}`);
  console.log(`🔌 Disconnected:    ${disconnectCount}`);
  console.log(`⚠️ Last Error:      ${lastErrorMessage}`);
  console.log(`====================================================`);
  console.log(`Waiting for teacher to start quiz / next question...`);
  console.log(`Press Ctrl+C to stop the test.`);
}, 2000);
