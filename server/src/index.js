// LiveQuizz Server — Entry Point (Scalable Architecture)
require('dotenv').config();

const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const streamifier = require('streamifier');

const { registerHandlers } = require('./socketHandlers');
const { getRedisClient, getSubscriberClient } = require('./redis');
const authRoutes = require('./routes/auth');
const quizRoutes = require('./routes/quiz');

// ─── Cloudinary Config ───────────────────────────────────────────────
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const upload = multer({ storage: multer.memoryStorage() });

const PORT = process.env.PORT || 3001;

// ─── Express Setup ───────────────────────────────────────────────────
const app = express();

app.use(cors({
  origin: true, // Automatically reflect the request origin
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true,
}));

app.use(express.json());

// Root endpoint for cron job pings
app.get('/', (req, res) => {
  res.send('LiveQuizz Server is active and running!');
});

// Health check endpoint
app.get('/health', async (req, res) => {
  const health = { status: 'ok', timestamp: Date.now() };
  try {
    const redis = await getRedisClient();
    if (redis && redis.isOpen) {
      await redis.ping();
      health.redis = 'connected';
    }
  } catch {
    health.redis = 'disconnected';
  }
  res.json(health);
});

// Image upload endpoint
app.post('/upload', upload.single('image'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, error: 'No image provided' });
  }

  const uploadStream = cloudinary.uploader.upload_stream(
    { folder: 'livequizz' },
    (error, result) => {
      if (error) {
        console.error('Cloudinary upload error:', error);
        return res.status(500).json({ success: false, error: 'Failed to upload image' });
      }
      res.json({
        success: true,
        imageUrl: result.secure_url,
        imageId: result.public_id,
      });
    }
  );

  streamifier.createReadStream(req.file.buffer).pipe(uploadStream);
});

// ─── API Routes ──────────────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/quizzes', quizRoutes);

// ─── HTTP + Socket.io Server ─────────────────────────────────────────
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: true, // Automatically reflect the request origin
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

// ─── Redis Adapter Setup (for horizontal scaling) ────────────────────
async function setupRedisAdapter() {
  try {
    const { createAdapter } = require('@socket.io/redis-adapter');
    const pubClient = await getRedisClient();
    const subClient = await getSubscriberClient();

    if (pubClient && pubClient.isOpen && subClient && subClient.isOpen) {
      io.adapter(createAdapter(pubClient, subClient));
      console.log('   ✅ Socket.io Redis adapter enabled (multi-instance scaling ready)');
    }
  } catch (err) {
    console.warn('   ⚠️  Redis adapter not available, using in-memory (single instance mode)');
    console.warn(`   Reason: ${err.message}`);
  }
}

// ─── Boot Sequence ───────────────────────────────────────────────────
async function start() {
  // 1. Try to connect Redis (optional — falls back gracefully)
  await setupRedisAdapter();

  // 2. Register all socket event handlers
  registerHandlers(io);

  // 3. Start HTTP server
  server.listen(PORT, () => {
    console.log(`\n🚀 LiveQuizz server running on http://localhost:${PORT}`);
    console.log(`   Socket.io ready for connections`);
    console.log(`   API routes: /api/auth, /api/quizzes\n`);
  });
}

start().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
