import { z } from "zod";

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