import { z } from "zod";

export const sendMessageSchema = z.object({
    accountId: z.uuid("Invalid account ID"),
    contactId: z.uuid("Invalid contact ID").optional(),
    phoneNumber: z.string().optional(), // Added support for sending by number directly
    type: z.enum(["text", "image", "video", "audio", "document", "sticker"]).default("text"),
    body: z.string().optional(),
    mediaId: z.string().optional(),
    mediaLink: z.url("Invalid media URL").optional(),
    replyToMessageId: z.string().optional(),
}).superRefine((data, ctx) => {
    // Ensure at least a contact ID or a phone number is provided
    if (!data.contactId && !data.phoneNumber) {
        ctx.addIssue({
            code: "custom",
            message: "Either contactId or phoneNumber must be provided",
            path: ["phoneNumber"],
        });
    }
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