// LiveQuizz Server — Entry Point

const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const { registerHandlers } = require('./socketHandlers');

const PORT = process.env.PORT || 3001;

// ─── Express Setup ───────────────────────────────────────────────────
const app = express();

app.use(cors({
  origin: true, // Automatically reflect the request origin
  methods: ['GET', 'POST'],
  credentials: true,
}));

app.use(express.json());

// Root endpoint for cron job pings
app.get('/', (req, res) => {
  res.send('LiveQuizz Server is active and running!');
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: Date.now() });
});

// ─── HTTP + Socket.io Server ─────────────────────────────────────────
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: true, // Automatically reflect the request origin
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

// Register all socket event handlers
registerHandlers(io);

// ─── Start Server ────────────────────────────────────────────────────
server.listen(PORT, () => {
  console.log(`\n🚀 LiveQuizz server running on http://localhost:${PORT}`);
  console.log(`   Socket.io ready for connections\n`);
});
