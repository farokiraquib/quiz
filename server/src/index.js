// LiveQuizz Server — Entry Point
require('dotenv').config();

const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const streamifier = require('streamifier');

const { registerHandlers } = require('./socketHandlers');

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
