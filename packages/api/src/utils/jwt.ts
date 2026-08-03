import { env } from "@/config/env";
import jwt, { SignOptions, VerifyOptions } from "jsonwebtoken";
const secret = env.JWT_SECRET;


export const signJwt = <T extends object>(payload: T, options?: SignOptions) => {
    return jwt.sign(payload, secret, options);
}

export const verifyJwt = <T extends object>(token: string, options?: VerifyOptions): T => {
    return jwt.verify(token, secret, options) as T;
}