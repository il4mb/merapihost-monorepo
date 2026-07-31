import 'dotenv/config';
import { LOGGER } from "@/utils/logger";

const REQUIRED_ENV = [
    "SERVER_NAME",
    "WHITELISTED_IPS",
    "MASTER_KEY",
    "PORT",
    "JWT_SECRET",
    "REDIS_HOST",
    "REDIS_PORT",
    "MYSQL_HOST",
    "MYSQL_PORT",
    "MYSQL_USER",
    "MYSQL_PASSWORD",
    "MYSQL_DATABASE",
    // "FIREBASE_PROJECT_ID",
    // "FIREBASE_CLIENT_EMAIL",
    // "FIREBASE_PRIVATE_KEY",
    "S3_ACCESS_KEY_ID",
    "S3_SECRET_ACCESS_KEY",
    "S3_BUCKET_NAME",
    "S3_ENDPOINT"
];

REQUIRED_ENV.forEach((key) => {
    if (!process.env[key]) {
        LOGGER.error(`Environment variable ${key} is not set.`);
        process.exit(1);
    }
});

export const env = {
    NODE_ENV: process.env.NODE_ENV || "development",
    PORT: process.env.PORT || 4020,
    SERVER_NAME: String(process.env.SERVER_NAME),
    MASTER_KEY: String(process.env.MASTER_KEY),
    WHITELISTED_IPS: String(process.env.WHITELISTED_IPS).split(",").map(ip => ip.trim()),

    JWT_SECRET: String(process.env.JWT_SECRET),

    // FIREBASE_PROJECT_ID: String(process.env.FIREBASE_PROJECT_ID),
    // FIREBASE_CLIENT_EMAIL: String(process.env.FIREBASE_CLIENT_EMAIL),
    // FIREBASE_PRIVATE_KEY: String(process.env.FIREBASE_PRIVATE_KEY).replace(/\\n/g, '\n'),
    
    REDIS_HOST: String(process.env.REDIS_HOST),
    REDIS_PORT: Number(process.env.REDIS_PORT),
    REDIS_PASSWORD: process.env.REDIS_PASSWORD ? String(process.env.REDIS_PASSWORD) : undefined,
    MYSQL_HOST: String(process.env.MYSQL_HOST),
    MYSQL_PORT: Number(process.env.MYSQL_PORT),
    MYSQL_USER: String(process.env.MYSQL_USER),
    MYSQL_PASSWORD: String(process.env.MYSQL_PASSWORD),
    MYSQL_DATABASE: String(process.env.MYSQL_DATABASE),
    S3_ACCESS_KEY_ID: String(process.env.S3_ACCESS_KEY_ID),
    S3_SECRET_ACCESS_KEY: String(process.env.S3_SECRET_ACCESS_KEY),
    S3_BUCKET_NAME: String(process.env.S3_BUCKET_NAME),
    S3_ENDPOINT: String(process.env.S3_ENDPOINT)
}