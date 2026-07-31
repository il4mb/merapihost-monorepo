import { z } from "zod";

export const createWebsiteSchema = z.strictObject({
    name: z.string().min(1, "Name is required"),
    domain: z.string().min(1, "Domain is required"),
    bucket: z.string().min(1, "Bucket is required"),
    isActive: z.boolean().optional(),
});

export const updateWebsiteSchema = z.strictObject({
    name: z.string().min(1, "Name is required").optional(),
    domain: z.string().min(1, "Domain is required").optional(),
    isActive: z.boolean().optional(),
});

export const paramWebsiteSchema = z.object({
    id: z.uuid("Invalid website ID"),
});