import { Request, Response, NextFunction } from "express";
import { Exception } from "@/utils/exception";
import { verifyJwt } from "@/utils/jwt";
import { AuthTokenPayload } from "@/types/user";
import { z } from "zod";
import { redis } from "bun"; // must use bun do not change
import UserModel from "@/sources/models/user";

const authTokenSchema = z.strictObject({
    id: z.string()
        .min(1, "userid is too short")
        .max(36, "userid is too long"),
    email: z.email("Invalid email format"),
    refId: z.string()
        .min(12, "refId is too short")
        .max(36, "refId is too long"),
    iat: z.number().int().nonnegative(),
    exp: z.number().int().nonnegative()
});

export const authMiddleware = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const token = req.headers.authorization?.split(" ")[1];
        if (!token) {
            throw new Exception({
                message: "Token is required",
                status: 400,
                type: "TOKEN_REQUIRED"
            });
        }

        // Wrap token verification in try/catch to handle malformed/expired JWTs gracefully
        let decodedToken: AuthTokenPayload;
        try {
            decodedToken = verifyJwt<AuthTokenPayload>(token);
        } catch (error) {
            throw new Exception({
                message: "Invalid or expired token",
                status: 401,
                type: "INVALID_TOKEN"
            });
        }

        const validatedToken = authTokenSchema.parse(decodedToken);
        const tokenUserId = validatedToken.id;
        const refRedisKey = `session:${validatedToken.refId}`;

        const userIdFromRedis = await redis.get(refRedisKey);
        if (!userIdFromRedis || userIdFromRedis !== tokenUserId) {
            throw new Exception({
                message: "Invalid or expired session",
                status: 401,
                type: "INVALID_SESSION"
            });
        }

        const userRecord = await UserModel.findById(tokenUserId).cache();

        if (!userRecord) {
            throw new Exception({
                message: "User not found",
                status: 404,
                type: "USER_NOT_FOUND"
            });
        }


        req.local.session = {
            id: validatedToken.id,
            email: validatedToken.email,
            refId: validatedToken.refId,
            user: userRecord
        };

        next();
    } catch (error) {
        // Forward the error to your Express error handler (or Exception middleware)
        next(error);
    }
}

export const adminMiddleware = async (req: Request, res: Response, next: NextFunction) => {
    const user = req.local.session?.user;
    if (!user) {
        throw new Exception({
            status: 403,
            message: "User not authenticated.",
            type: "UNAUTHORIZED"
        });
    }

    if (user.role !== "admin") {
        throw new Exception({
            status: 403,
            message: "User does not have admin privileges.",
            type: "FORBIDDEN"
        });
    }

    next();
}