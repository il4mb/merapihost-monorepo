import crypto from "crypto";
import { env } from "@/config/env";
import UserModel from "@/sources/models/user";
import { loginEmailSchema, authTokenSchema, registerSchema, updateMeSchema } from "@/sources/schemas";
import { Exception } from "@/utils/exception";
import { auth } from "@/utils/firebase";
import { signJwt } from "@/utils/jwt";
import { Request, Response } from "express";
import { redis } from "bun";
import { AuthTokenPayload } from "@/types/user";

const isProd = env.NODE_ENV === "production";
const TOKEN_EXPIRATION = isProd ? "1h" : "7d";
const REDIS_TTL_SEC = isProd ? 3600 : 604800; // 3600s = 1h, 604800s = 7d

export const loginWithGoogle = async (req: Request, res: Response) => {
    const { token } = authTokenSchema.parse(req.body);
    const decodedToken = await auth.verifyIdToken(token).catch(() => null);
    if (!decodedToken) {
        throw new Exception({
            message: "Invalid token",
            status: 401,
            type: "INVALID_TOKEN"
        });
    }
    const userRecord = await UserModel.findOne({ email: decodedToken.email }).cache();
    if (!userRecord) {
        throw new Exception({
            message: "User not found",
            status: 404,
            type: "USER_NOT_FOUND"
        });
    }

    if (!userRecord.isVerified) {
        // If the user is not verified, we can mark them as verified since they have successfully logged in with Google.
        await UserModel.findByIdAndUpdate(userRecord._id, { isVerified: true });
    }

    // 1. Generate session reference ID
    const refId = crypto.randomUUID();

    // 2. Store refId in Redis with TTL matching the JWT expiration
    await redis.set(`session:${refId}`, userRecord._id.toString(), "EX", REDIS_TTL_SEC);

    // 3. Include refId in JWT payload
    const tokenAuth = signJwt<AuthTokenPayload>({
        firebaseUid: decodedToken.uid,
        id: userRecord._id.toString(),
        email: userRecord.email,
        refId
    }, { expiresIn: TOKEN_EXPIRATION });

    res.status(200).json({
        success: true,
        message: "User authenticated successfully",
        token: tokenAuth
    });
}

export const loginWithEmailAndPassword = async (req: Request, res: Response) => {
    const { email, password } = loginEmailSchema.parse(req.body);
    const userRecord = await UserModel.findOne({ email }).cache();
    if (!userRecord) {
        throw new Exception({
            message: "User not found",
            status: 404,
            type: "USER_NOT_FOUND"
        });
    }
    if (!userRecord.password) {
        throw new Exception({
            message: "User does not have a password set. Please use Google login.",
            status: 400,
            type: "PASSWORD_NOT_SET"
        });
    }
    const isPasswordValid = await Bun.password.verify(password, userRecord.password).catch(() => false);
    if (!isPasswordValid) {
        throw new Exception({
            message: "Invalid password",
            status: 401,
            type: "INVALID_PASSWORD"
        });
    }

    const refId = crypto.randomUUID();
    await redis.set(`session:${refId}`, userRecord._id.toString(), "EX", REDIS_TTL_SEC);

    const tokenAuth = signJwt<AuthTokenPayload>({
        id: userRecord._id.toString(),
        email: userRecord.email,
        refId
    }, { expiresIn: TOKEN_EXPIRATION });

    res.status(200).json({
        success: true,
        message: "User authenticated successfully",
        token: tokenAuth
    });
}

export const registerWithGoogle = async (req: Request, res: Response) => {
    const { token } = authTokenSchema.parse(req.body);
    const decodedToken = await auth.verifyIdToken(token).catch(() => null);
    if (!decodedToken) {
        throw new Exception({
            message: "Invalid token",
            status: 401,
            type: "INVALID_TOKEN"
        });
    }
    const existingUser = await UserModel.findOne({ email: decodedToken.email }).cache();
    if (existingUser) {
        throw new Exception({
            message: "User already exists",
            status: 400,
            type: "USER_ALREADY_EXISTS"
        });
    }
    const userRecord = await UserModel.create({
        email: decodedToken.email,
        name: decodedToken.displayName || "",
        password: "",
        status: "active",
        role: "user",
        provider: ["google"],
        isVerified: decodedToken.email_verified || false
    }).catch(() => null);

    if (!userRecord) {
        throw new Exception({
            message: "Failed to create user",
            status: 500,
            type: "USER_CREATION_FAILED"
        });
    }

    const refId = crypto.randomUUID();
    await redis.set(`session:${refId}`, userRecord._id.toString(), "EX", REDIS_TTL_SEC);

    const tokenAuth = signJwt<AuthTokenPayload>({
        id: userRecord._id.toString(),
        email: userRecord.email,
        refId
    }, { expiresIn: TOKEN_EXPIRATION });

    res.status(201).json({
        success: true,
        message: "User registered successfully",
        token: tokenAuth
    });
}

export const register = async (req: Request, res: Response) => {
    const { email, password, name } = registerSchema.parse(req.body);
    const existingUser = await UserModel.findOne({ email }).cache();
    if (existingUser) {
        throw new Exception({
            message: "User already exists",
            status: 400,
            type: "USER_ALREADY_EXISTS"
        });
    }

    const passwordHash = await Bun.password.hash(password, {
        algorithm: "bcrypt",
        cost: 8
    });
    const userRecord = await UserModel.create({
        email,
        name,
        password: passwordHash,
        status: "active",
        role: "user",
        provider: ["email"]
    }).catch(() => null);

    if (!userRecord) {
        throw new Exception({
            message: "Failed to create user",
            status: 500,
            type: "USER_CREATION_FAILED"
        });
    }

    const refId = crypto.randomUUID();
    await redis.set(`session:${refId}`, userRecord._id.toString(), "EX", REDIS_TTL_SEC);

    const tokenAuth = signJwt<AuthTokenPayload>({
        id: userRecord._id.toString(),
        email: userRecord.email,
        refId
    }, { expiresIn: TOKEN_EXPIRATION });

    res.status(201).json({
        success: true,
        message: "User registered successfully",
        token: tokenAuth
    });
}

export const logout = async (req: Request, res: Response) => {
    const session = req.local.session; // Must contain decoded JWT properties (including refId)
    if (!session) {
        throw new Exception({
            message: "User not authenticated",
            status: 401,
            type: "USER_NOT_AUTHENTICATED"
        });
    }

    // 4. Delete the session from Redis to effectively invalidate the JWT early
    if (session.refId) {
        await redis.del(`session:${session.refId}`);
    }

    // Keep Firebase token revocation if it exists
    if (session.firebaseUid) {
        await auth.revokeRefreshTokens(session.firebaseUid).catch(() => null);
    }

    res.status(200).json({
        success: true,
        message: "User logged out successfully"
    });
}

export const getMe = async (req: Request, res: Response) => {
    const session = req.local.session;
    if (!session?.user) {
        throw new Exception({
            message: "User not authenticated",
            status: 401,
            type: "USER_NOT_AUTHENTICATED"
        });
    }

    res.status(200).json({
        success: true,
        message: "User retrieved successfully",
        user: {
            id: session.user._id,
            email: session.user.email,
            name: session.user.name,
            status: session.user.status,
            provider: session.user.provider,
            isVerified: session.user.isVerified
        }
    });
}


export const updateMe = async (req: Request, res: Response) => {
    const session = req.local.session;
    if (!session) {
        throw new Exception({
            message: "User not authenticated",
            status: 401,
            type: "USER_NOT_AUTHENTICATED"
        });
    }
    const { name } = updateMeSchema.parse(req.body);
    const updatedUser = await UserModel.findByIdAndUpdate(session.user._id, { name }, { returnDocument: "after" });
    if (!updatedUser) {
        throw new Exception({
            message: "Failed to update user",
            status: 500,
            type: "USER_UPDATE_FAILED"
        });
    }

    res.status(200).json({
        success: true,
        message: "User updated successfully",
        user: {
            id: updatedUser._id,
            email: updatedUser.email,
            name: updatedUser.name,
            status: updatedUser.status,
            provider: updatedUser.provider,
            isVerified: updatedUser.isVerified
        }
    });
}