import { z } from "zod";


export const serverInfoData = z.object({
    status: z.string(),
    name: z.string(),
    timestamp: z.string(),
    system: z.object({
        platform: z.string(),
        architecture: z.string(),
        osRelease: z.string(),
        serverUptime: z.number(),
        formattedServerUptime: z.string()
    }),
    process: z.object({
        pid: z.number(),
        workerUptime: z.number(),
        formattedWorkerUptime: z.string(),
        nodeVersion: z.string()
    }),
    storage: z.object({
        totalStorage: z.number(),
        formattedTotalStorage: z.string(),
        freeStorage: z.number(),
        formattedFreeStorage: z.string(),
        usedStorage: z.number(),
        formattedUsedStorage: z.string()
    }),
    memory: z.object({
        totalSystem: z.number(),
        formattedTotalSystem: z.string(),
        freeSystem: z.number(),
        formattedFreeSystem: z.string(),
        usedSystem: z.number(),
        formattedUsedSystem: z.string(),
        processRss: z.number(),
        formattedProcessRss: z.string(),
        processHeapUsed: z.number(),
        formattedProcessHeapUsed: z.string()
    }),
    cpu: z.object({
        cores: z.number(),
        model: z.string(),
        loadAverage: z.object({
            "1m": z.string(),
            "5m": z.string(),
            "15m": z.string()
        })
    })
});

export const createServerSchema = z.strictObject({
    hostname: z.string()
        .min(1, "Hostname is required")
        .max(64, "Hostname must be at most 64 characters long"),
    masterKey: z.string()
        .min(12, "Master Key is required and must be at least 12 characters long")
        .max(64, "Master Key must be at most 64 characters long"),
    description: z.string()
        .max(256, "Description must be at most 256 characters long")
        .optional(),
    isActive: z.boolean().optional(),
});

export const updateServerSchema = createServerSchema.partial().refine((data) => Object.keys(data).length > 0, {
    message: "At least one field must be provided for update",
});

export type InputCreateServer = z.infer<typeof createServerSchema>;