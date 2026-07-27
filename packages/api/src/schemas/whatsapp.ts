import { z } from "zod";

export const sendMessageSchema = z.object({
    accountId: z.uuid("Invalid account ID"),
    contactId: z.uuid("Invalid contact ID"),
    type: z.enum(["text", "image", "video", "audio", "document", "sticker"]).default("text"),
    body: z.string().optional(), // Text message content OR caption for media
    mediaId: z.string().optional(), // If sending via an already uploaded WhatsApp Media ID
    mediaLink: z.url("Invalid media URL").optional(), // If sending via a public URL (e.g., your S3 bucket)
    replyToMessageId: z.string().optional(),
}).superRefine((data, ctx) => {
    if (data.type === "text" && !data.body) {
        ctx.addIssue({
            code: "custom",
            message: "Text message requires a body",
            path: ["body"],
        });
    }
    if (data.type !== "text" && !data.mediaId && !data.mediaLink) {
        ctx.addIssue({
            code: "custom",
            message: "Media message requires either mediaId or mediaLink",
            path: ["mediaId"],
        });
    }
});

export type SendMessageInput = z.infer<typeof sendMessageSchema>;