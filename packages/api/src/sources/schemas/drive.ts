import { z } from "zod";
import { Types } from "mongoose";

// Helper to prevent server crashes from invalid ObjectIds
const objectIdSchema = z.string().refine((val) => Types.ObjectId.isValid(val), {
    message: "Invalid ObjectId format.",
});

// Reusable name validator to enforce safe file/folder names
const nameSchema = z.string()
    .min(1, "Name cannot be empty.")
    .max(255, "Name cannot exceed 255 characters.")
    .regex(/^[^<>:;,?"*|/]+$/, "Name cannot contain invalid characters (<> : ; , ? \" * | /).")
    .trim();

export const driveQuerySchema = z.object({
    folderId: objectIdSchema.optional().nullable().default(null),
});

export const driveCreateFolderSchema = z.object({
    name: nameSchema,
    folderId: objectIdSchema.nullable(),
});

export const driveRenameSchema = z.object({
    newName: nameSchema,
});

export const driveMoveCopySchema = z.object({
    newParentId: objectIdSchema.nullable(),
});