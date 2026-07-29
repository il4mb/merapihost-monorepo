import { Queue } from "bullmq";
import { config } from "@/config/redis";

export const BOOT_QUEUE_NAME = "boot-queue";

export interface BootQueueJobData {
    accountId: string;
    contactId: string;
    messageId: string;
}

export const bootQueue = new Queue<BootQueueJobData>(BOOT_QUEUE_NAME, {
    connection: {
        host: config.host,
        port: config.port,
        password: config.password,
    },
    defaultJobOptions: {
        removeOnComplete: true,
        removeOnFail: true,
    },
});