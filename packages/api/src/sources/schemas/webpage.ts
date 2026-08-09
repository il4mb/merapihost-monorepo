import { z } from "zod";

export const WEBPAGE_FIELDS = ["id", "title", "description", "route", "meta", "nodes", "createdAt", "updatedAt"] as const;

// Internal schema to validate a single item against your allowed fields
const singleFieldSchema = z.string().refine((v) => WEBPAGE_FIELDS.includes(v as any), {
    message: `Invalid field. Valid fields are: ${WEBPAGE_FIELDS.join(", ")}`,
});

// The exported schema that handles the string-to-array transformation and validation
export const fieldsWebpageSchema = z.preprocess(
    (val) => {
        // Handle "?fields=id,title"
        if (typeof val === "string") {
            return val.split(",").map((s) => s.trim());
        }
        // Handle "?fields=id&fields=title"
        if (Array.isArray(val)) {
            return val;
        }
        return val;
    },
    z.array(singleFieldSchema)
);

export const webpageQuerySchema = z.object({
    fields: fieldsWebpageSchema.optional(),
    limit: z.coerce.number().int().min(1).max(100).optional(),
    offset: z.coerce.number().int().min(0).optional(),
});



export const nodeSchema = z.strictObject({
    id: z.coerce.string(),
    tagName: z.string().min(1).optional(),
    type: z.string().optional(),
    props: z.record(z.string(), z.any()).optional(),
    content: z.string().optional(),
    parent: z.string().nullable(),
}).superRefine((data, ctx) => {
    if (!data.tagName && !data.type) {
        ctx.addIssue({
            code: "custom",
            message: "Either tagName or type must be provided",
            path: ["tagName", "type"],
        });
    }
});

export const createWebpageSchema = z.strictObject({
    title: z.string().min(1, "Title is required"),
    description: z.string(),
    route: z.string().min(1, "Route is required"),
    meta: z.string().optional(),
    nodes: z.array(nodeSchema),
});

export const updateWebpageSchema = createWebpageSchema.partial();

export const paramWebpageSchema = z.object({
    id: z.uuid("Invalid webpage ID"),
});

