import { io } from 'socket.io-client';
import Constants from 'expo-constants';

// Reads from app.json > expo.extra.serverUrl for production builds
// Falls back to localhost for development
const SERVER_URL =
  Constants.expoConfig?.extra?.serverUrl !== 'SERVER_URL_PLACEHOLDER'
    ? Constants.expoConfig?.extra?.serverUrl
    : 'http://localhost:3001';

const socket = io(SERVER_URL, {
  autoConnect: false,
  transports: ['websocket'], // Skip polling for React Native
});

export default socket;
