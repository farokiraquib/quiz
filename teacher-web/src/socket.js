import { io } from 'socket.io-client';

const SERVER_URL = import.meta.env.VITE_SERVER_URL || (window.location.hostname === 'localhost' ? 'http://localhost:3001' : window.location.origin);

const socket = io(SERVER_URL, {
  autoConnect: false,
  transports: ['websocket'],   // Skip HTTP polling — go straight to WebSocket
});

// ── Diagnostic: confirm transport after connect ──
socket.on('connect', () => {
  console.log(`[PERF] Socket connected, transport: ${socket.io.engine.transport.name}`);
});
socket.io.on('upgrade', (transport) => {
  console.log(`[PERF] Socket upgraded to: ${transport.name}`);
});

export { SERVER_URL };
export default socket;
