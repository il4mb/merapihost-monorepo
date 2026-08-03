import { isValidDomain } from "@/utils/tools";
import { z } from "zod";

const baseWebsiteSchema = z.object({
    domain: z.string()
        .min(1, "Domain is required")
        .max(120, "Domain cannot exceed 120 characters"),
    serverId: z.string()
        .min(1, "Server ID is required")
        .optional()
        .nullable(),
    name: z.string()
        .min(1, "Website name is required")
        .max(100, "Website name cannot exceed 100 characters"),
    description: z.string()
        .max(500, "Description cannot exceed 500 characters")
        .optional()
});

export const createWebsiteSchema = baseWebsiteSchema
    .superRefine((data, ctx) => {
        if (data.domain) {
            const isValid = isValidDomain(data.domain);
            if (!isValid) {
                ctx.addIssue({
                    code: "custom",
                    message: "Invalid domain format",
                    path: ["domain"]
                });
            }
        }
    });

export const updateWebsiteSchema = baseWebsiteSchema
    .partial()
    .superRefine((data, ctx) => {
        if (data.domain) {
            const isValid = isValidDomain(data.domain);
            if (!isValid) {
                ctx.addIssue({
                    code: "custom",
                    message: "Invalid domain format",
                    path: ["domain"]
                });
            }
        }
    });

export type CreateWebsiteInput = z.infer<typeof createWebsiteSchema>;
export type UpdateWebsiteInput = z.infer<typeof updateWebsiteSchema>;