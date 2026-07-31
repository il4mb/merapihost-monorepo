import { loginSchema, registerSchema } from "@/utils/schemas/auth";
import { Exception } from "@/utils/exception";
import { auth } from "@/utils/firebase";
import { Request, Response } from "express";

export const login = async (req: Request, res: Response) => {
    const { email, password } = loginSchema.parse(req.body);
    res.status(200).json({ message: "Login successful", email, password });
}

export const register = async (req: Request, res: Response) => {
    const { email, password } = registerSchema.parse(req.body);
    const existingUser = await auth.getUserByEmail(email).catch(() => null);
    if (existingUser) {
        throw new Exception({
            message: "User already exists",
            status: 400,
            type: "USER_ALREADY_EXISTS"
        });
    }
    auth.createUser({
        email,
        password,
    })
        .then((userRecord) => {
            res.status(201).json({ message: "User registered successfully", user: userRecord });
        })
        .catch((error) => {
            let errorMessage = "An error occurred while registering the user";
            switch (error.code) {
                case "auth/email-already-exists":
                    errorMessage = "Email already exists";
                    break;
                case "auth/invalid-password":
                    errorMessage = "Invalid password";
                    break;
                case "auth/invalid-email":
                    errorMessage = "Invalid email";
                    break;
            }
            throw new Exception({
                message: errorMessage,
                status: 500,
                type: "INTERNAL_SERVER_ERROR"
            });
        });
}