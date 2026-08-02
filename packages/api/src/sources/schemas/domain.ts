import { isValidDomain } from "@/utils/tools";
import { z } from "zod";

export const createDomainSchema = z.object({
    domain: z.string().min(1, "Domain name is required").max(120, "Domain name must be less than 120 characters"),
    type: z.enum(["internal", "external"]).default("external"),
}).superRefine((data, ctx) => {
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

export type CreateDomainInput = z.infer<typeof createDomainSchema>;