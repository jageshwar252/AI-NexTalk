import Redis from "ioredis";

const redisConfigMissing = !process.env.REDIS_URL;

const createNoopRedisClient = () => ({
    get: async () => null,
    set: async () => "OK",
    on: () => {},
});

const redisClient = redisConfigMissing
    ? createNoopRedisClient()
    : process.env.REDIS_URL.startsWith("redis://") || process.env.REDIS_URL.startsWith("rediss://")
        ? new Redis(process.env.REDIS_URL)
        : new Redis({
            host: process.env.REDIS_URL,
            port: process.env.REDIS_PORT,
            password: process.env.REDIS_PASSWORD
        });

if (redisConfigMissing) {
    console.warn("Redis not configured. Token blacklist is disabled.");
} else {
    redisClient.on('connect', () => {
        console.log('Redis connected');
    });
}

export default redisClient
