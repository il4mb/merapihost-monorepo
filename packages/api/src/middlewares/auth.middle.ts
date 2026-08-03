import { Request, Response, NextFunction } from "express";
import { auth } from "@/utils/firebase";
import { Exception } from "@/utils/exception";

export const authMiddleware = async (req: Request, res: Response, next: NextFunction) => {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) {
        throw new Exception({
            message: "Token is required",
            status: 400,
            type: "TOKEN_REQUIRED"
        });
    }
    const decodedToken = await auth.verifyIdToken(token).catch(() => null);
    if (!decodedToken) {
        throw new Exception({
            message: "Invalid token",
            status: 401,
            type: "INVALID_TOKEN"
        });
    }
    req.local.user = { ...decodedToken };
    next();
}