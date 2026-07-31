import { loginSchema, registerSchema } from "@/utils/schemas/auth";
import { Exception } from "@/utils/exception";
import { auth } from "@/utils/firebase";
import { Request, Response } from "express";

export const login = async (req: Request, res: Response) => {
    const { token } = loginSchema.parse(req.body);
    const decodedToken = await auth.verifyIdToken(token).catch(() => null);
    if (!decodedToken) {
        throw new Exception({
            message: "Invalid token",
            status: 401,
            type: "INVALID_TOKEN"
        });
    }
    const userRecord = await auth.getUser(decodedToken.uid).catch(() => null);
    if (!userRecord) {
        throw new Exception({
            message: "User not found",
            status: 404,
            type: "USER_NOT_FOUND"
        });
    }
    res.status(200).json({
        success: true,
        message: "User authenticated successfully"
    });
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
    auth.createUser({ email, password })
        .then((userRecord) => {
            res.status(201).json({
                success: true,
                message: "User registered successfully",
                user: userRecord
            });
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

export const logout = async (req: Request, res: Response) => {
    const user = req.user;
    if (!user) {
        throw new Exception({
            message: "User not authenticated",
            status: 401,
            type: "USER_NOT_AUTHENTICATED"
        });
    }
    await auth.revokeRefreshTokens(user.uid).catch(() => null);
    res.status(200).json({
        success: true,
        message: "User logged out successfully"
    });
}

export const getMe = async (req: Request, res: Response) => {
    const user = req.user;
    if (!user) {
        throw new Exception({
            message: "User not authenticated",
            status: 401,
            type: "USER_NOT_AUTHENTICATED"
        });
    }
    res.status(200).json({
        success: true,
        message: "User retrieved successfully",
        user: user
    });
}   