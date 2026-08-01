import { S3Client } from "@aws-sdk/client-s3";
import { S3Client as BunS3Client } from "bun";
import { env } from "@/config/env";


if (!env.S3_BUCKET_NAME || !env.S3_ACCESS_KEY_ID || !env.S3_SECRET_ACCESS_KEY || !env.S3_ENDPOINT) {
    throw new Error("Missing S3 configuration in environment variables");
}

const endpoint = env.S3_ENDPOINT.startsWith("http") ? env.S3_ENDPOINT : `https://${env.S3_ENDPOINT}`;

export const s3Client = new BunS3Client({
    bucket: env.S3_BUCKET_NAME,
    accessKeyId: env.S3_ACCESS_KEY_ID,
    secretAccessKey: env.S3_SECRET_ACCESS_KEY,
    endpoint
});

export const awS3Client = new S3Client({
    region: "us-east-1",
    endpoint,
    credentials: {
        accessKeyId: env.S3_ACCESS_KEY_ID,
        secretAccessKey: env.S3_SECRET_ACCESS_KEY,
    },
});