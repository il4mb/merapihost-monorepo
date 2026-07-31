import { env } from "@/config/env";
import { Exception } from "@/utils/exception";
import { Request, Response, NextFunction } from "express";

export async function masterVerifyMiddleware(req: Request, res: Response, next: NextFunction) {
    const requestIp = String(req.ip || req.socket.remoteAddress).replace("::ffff:", ""); // Normalize IPv4-mapped IPv6 addresses
    const masterKey = req.headers["x-master-key"];
    const isDevelopment = env.NODE_ENV === "development";

    if (!isDevelopment && (!masterKey || masterKey !== env.MASTER_KEY)) {
        throw new Exception({
            status: 403,
            message: "Master key is missing or invalid",
            type: "FORBIDDEN"
        });
    }

    // Match exact IPs or complex wildcards using RegEx
    const isWhitelisted = requestIp && env.WHITELISTED_IPS.some((allowedIp) => {
        // Convert "172.*.*.1" into the regex pattern /^172\..*\..*\.1$/
        const regexString = "^" + allowedIp.replace(/\./g, "\\.").replace(/\*/g, ".*") + "$";
        const regex = new RegExp(regexString);

        return regex.test(requestIp);
    });

    if (!isWhitelisted) {
        throw new Exception({
            status: 403,
            message: "Request IP is not whitelisted",
            type: "FORBIDDEN",
            details: [
                {
                    field: "ip",
                    message: `Request IP ${requestIp} is not in the whitelisted IPs`
                }
            ]
        });
    }

    next();
}