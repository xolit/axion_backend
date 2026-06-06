const { createClient } = require('redis');

const url = process.env.REDIS_URL || 'redis://localhost:6379';
const client = createClient({ url });

client.on('error', (err) => console.error('Redis Client Error', err));
client.on('connect', () => console.log('Redis connecting...'));
client.on('ready', () => console.log('Redis ready'));

module.exports = client;
