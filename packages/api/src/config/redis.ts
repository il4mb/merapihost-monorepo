import { RedisClient } from "bun";
import { env } from "@/config/env";

const redis = new RedisClient(`redis://${env.REDIS_HOST}:${env.REDIS_PORT}`);

export const config = {
    host: env.REDIS_HOST,
    port: env.REDIS_PORT,
    password: env.REDIS_PASSWORD
};

export const getRedis = async () => {
    if (redis.connected) {
        await redis.connect();
    }
    return redis;
}
