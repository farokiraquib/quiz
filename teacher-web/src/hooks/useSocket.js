import { useEffect, useRef, useCallback } from 'react';
import socket from '../socket';

/**
 * Custom hook for subscribing to socket events with optional throttle support.
 *
 * @param {string} eventName - The socket event name to listen for
 * @param {Function} callback - Handler function called with event data
 * @param {number} throttleMs - If > 0, batches incoming events using setTimeout
 */
export default function useSocket(eventName, callback, throttleMs = 0) {
  const callbackRef = useRef(callback);
  const timerRef = useRef(null);
  const latestDataRef = useRef(null);

  // Keep callback ref current without re-subscribing
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  useEffect(() => {
    if (!eventName) return;

    const handler = (data) => {
      if (throttleMs > 0) {
        latestDataRef.current = data;
        if (timerRef.current === null) {
          timerRef.current = setTimeout(() => {
            callbackRef.current(latestDataRef.current);
            timerRef.current = null;
            latestDataRef.current = null;
          }, throttleMs);
        }
      } else {
        callbackRef.current(data);
      }
    };

    socket.on(eventName, handler);

    return () => {
      socket.off(eventName, handler);
      if (timerRef.current !== null) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [eventName, throttleMs]);
}
