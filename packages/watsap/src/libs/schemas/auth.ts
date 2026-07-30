import { z } from "zod";

export const loginSchema = z.object({
    email: z.email({ message: "Email tidak valid" }),
    password: z.string().min(6, { message: "Password harus memiliki minimal 6 karakter" }),
}).superRefine((data, ctx) => {
    if (data.password.length < 6) {
        ctx.addIssue({
            code: "custom",
            message: "Password harus memiliki minimal 6 karakter",
            path: ["password"],
        });
    }
    if (!data.email.includes("@")) {
        ctx.addIssue({
            code: "custom",
            message: "Email harus mengandung '@'",
            path: ["email"],
        });
    }
});