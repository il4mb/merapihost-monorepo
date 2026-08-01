import { z } from "zod";

export const webpageMetaSchema = z.strictObject({
    name: z.string().min(1, "Name is required"),
    type: z.string().min(1, "Type is required"),
    content: z.string().min(1, "Content is required"),
});

export const nodeSchema = z.strictObject({
    id: z.coerce.string(),
    tagName: z.string().min(1).optional(),
    type: z.string().optional(),
    props: z.record(z.string(), z.any()).optional(),
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
    meta: z.array(webpageMetaSchema),
    nodes: z.array(nodeSchema),
});

export const updateWebpageSchema = createWebpageSchema.partial();

export const paramWebpageSchema = z.object({
    id: z.uuid("Invalid webpage ID"),
});