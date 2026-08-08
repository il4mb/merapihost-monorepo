import 'dotenv/config';
import { LOGGER } from "@/utils/logger";

const REQUIRED_ENV = [
    "ENCRYPTION_KEY",
    "JWT_SECRET",
    "WHATSAPP_CALLBACK_VERIFY_CODE",
    "WHATSAPP_API_TOKEN",
    "REDIS_URL",
    "REDIS_HOST",
    "REDIS_PORT",
    "MONGODB_URI",
    "FIREBASE_PROJECT_ID",
    "FIREBASE_CLIENT_EMAIL",
    "FIREBASE_PRIVATE_KEY",
    "S3_ACCESS_KEY_ID",
    "S3_SECRET_ACCESS_KEY",
    "S3_BUCKET_NAME",
    "S3_ENDPOINT",
    "GEMINI_API_KEY",
    "DEEPSEEK_API_KEY"
];

REQUIRED_ENV.forEach((key) => {
    if (!process.env[key]) {
        LOGGER.error(`Environment variable ${key} is not set.`);
        process.exit(1);
    }
});

export const env = {
    ENCRYPTION_KEY: String(process.env.ENCRYPTION_KEY),
    JWT_SECRET: String(process.env.JWT_SECRET),
    WHATSAPP_CALLBACK_VERIFY_CODE: String(process.env.WHATSAPP_CALLBACK_VERIFY_CODE),
    WHATSAPP_API_TOKEN: String(process.env.WHATSAPP_API_TOKEN),

    FIREBASE_PROJECT_ID: String(process.env.FIREBASE_PROJECT_ID),
    FIREBASE_CLIENT_EMAIL: String(process.env.FIREBASE_CLIENT_EMAIL),
    FIREBASE_PRIVATE_KEY: String(process.env.FIREBASE_PRIVATE_KEY).replace(/\\n/g, '\n'),

    NODE_ENV: process.env.NODE_ENV || "development",
    PORT: process.env.PORT || 4000,

    REDIS_URL: String(process.env.REDIS_URL),
    REDIS_HOST: String(process.env.REDIS_HOST),
    REDIS_PORT: Number(process.env.REDIS_PORT),
    REDIS_PASSWORD: process.env.REDIS_PASSWORD ? String(process.env.REDIS_PASSWORD) : undefined,

    MONGODB_URI: String(process.env.MONGODB_URI),
    MYSQL_HOST: String(process.env.MYSQL_HOST),
    MYSQL_PORT: Number(process.env.MYSQL_PORT),
    MYSQL_USER: String(process.env.MYSQL_USER),
    MYSQL_PASSWORD: String(process.env.MYSQL_PASSWORD),
    MYSQL_DATABASE: String(process.env.MYSQL_DATABASE),

    S3_ACCESS_KEY_ID: String(process.env.S3_ACCESS_KEY_ID),
    S3_SECRET_ACCESS_KEY: String(process.env.S3_SECRET_ACCESS_KEY),
    S3_BUCKET_NAME: String(process.env.S3_BUCKET_NAME),
    S3_ENDPOINT: String(process.env.S3_ENDPOINT),

    GEMINI_API_KEY: String(process.env.GEMINI_API_KEY),
    DEEPSEEK_API_KEY: String(process.env.DEEPSEEK_API_KEY)
}

// env.ENCRYPTION_KEY must be exactly 32 bytes (256 bits) for AES-256-GCM
if (Buffer.from(env.ENCRYPTION_KEY, 'hex').length !== 32) {
    LOGGER.error("ENCRYPTION_KEY must be exactly 32 bytes (256 bits) in length.");
    process.exit(1);
}