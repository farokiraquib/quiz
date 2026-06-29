// Redis client singleton for LiveQuizz
// Uses REDIS_URL env var (e.g. redis://localhost:6379 or Render Redis URL)

const { createClient } = require('redis');

let client = null;
let subscriberClient = null;

/**
 * Creates and connects the Redis client singleton.
 * @returns {Promise<import('redis').RedisClientType>}
 */
async function getRedisClient() {
  if (client && client.isOpen) return client;

  const url = process.env.REDIS_URL || 'redis://localhost:6379';

  client = createClient({ url });

  client.on('error', (err) => {
    console.error('[Redis] Client error:', err.message);
  });

  client.on('connect', () => {
    console.log('[Redis] Connected');
  });

  client.on('reconnecting', () => {
    console.log('[Redis] Reconnecting...');
  });

  await client.connect();
  return client;
}

/**
 * Creates a duplicate client for the Socket.io Redis adapter subscriber.
 * @returns {Promise<import('redis').RedisClientType>}
 */
async function getSubscriberClient() {
  if (subscriberClient && subscriberClient.isOpen) return subscriberClient;

  const pub = await getRedisClient();
  subscriberClient = pub.duplicate();

  subscriberClient.on('error', (err) => {
    console.error('[Redis] Subscriber error:', err.message);
  });

  await subscriberClient.connect();
  return subscriberClient;
}

/**
 * Gracefully disconnects all Redis clients.
 */
async function disconnectRedis() {
  try {
    if (subscriberClient && subscriberClient.isOpen) {
      await subscriberClient.disconnect();
    }
    if (client && client.isOpen) {
      await client.disconnect();
    }
    console.log('[Redis] Disconnected');
  } catch (err) {
    console.error('[Redis] Disconnect error:', err.message);
  }
}

module.exports = {
  getRedisClient,
  getSubscriberClient,
  disconnectRedis,
};
