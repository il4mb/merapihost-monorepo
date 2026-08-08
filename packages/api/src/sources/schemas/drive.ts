import { z } from "zod";
import { Types } from "mongoose";

// 1. Define the base string validator for ObjectId
const objectIdStringSchema = z.string().refine((val) => Types.ObjectId.isValid(val), {
    message: "Invalid ObjectId format.",
});

// 2. Preprocess AND make the inner schema nullable
const objectIdSchema = z.preprocess(
    (val) => (val === "null" || val === "undefined" || val === "" ? null : val),
    objectIdStringSchema.nullable() // <--- FIX: .nullable() goes inside here
);

// Reusable name validator to enforce safe file/folder names
const nameSchema = z.string()
    .min(1, "Name cannot be empty.")
    .max(255, "Name cannot exceed 255 characters.")
    .regex(/^[^<>:;,?"*|/]+$/, "Name cannot contain invalid characters (<> : ; , ? \" * | /).")
    .trim();

// 3. Use objectIdSchema directly (no need to chain .nullable() again)
export const driveQuerySchema = z.object({
    folderId: objectIdSchema.optional().default(null),
});

export const driveCreateFolderSchema = z.object({
    name: nameSchema,
    folderId: objectIdSchema,
});

export const driveRenameSchema = z.object({
    newName: nameSchema,
});

export const driveMoveCopySchema = z.object({
    newParentId: objectIdSchema,
});