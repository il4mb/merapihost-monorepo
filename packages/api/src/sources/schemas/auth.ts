import { z } from "zod";

const allowedEmailDomains = ["gmail.com", "yahoo.com", "outlook.com"]; // Add allowed domains here
const primaryEmailSchema = z
    .email("Invalid email address")
    .refine((email) => {
        const emailDomain = email.split("@")[1];
        return allowedEmailDomains.includes(emailDomain);
    }, {
        message: `Please use your primary email address from one of the following domains: ${allowedEmailDomains.join(", ")}`,
    });

export const loginEmailSchema = z.object({
    email: z.email("Invalid email address"),
    password: z.string().min(6, "Password must be at least 6 characters long"),
});

export const authTokenSchema = z.object({
    token: z.string().min(1, "Token is missing"),
});

export const registerSchema = z.object({
    name: z.string().min(1, "Name is required").max(100, "Name cannot exceed 100 characters"),
    email: primaryEmailSchema,
    password: z.string().min(6, "Password must be at least 6 characters long"),
    confirmPassword: z.string().min(6, "Confirm password must be at least 6 characters long"),
}).refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"]
});


export const updateMeSchema = z.object({
    name: z.string().min(1, "Name is required").max(100, "Name cannot exceed 100 characters").optional()
});