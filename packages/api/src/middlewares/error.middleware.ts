import { ZodError } from "zod";
import { NextFunction, Request, Response } from "express";
import { Exception } from "@/utils/exception";
import { LOGGER } from "@/utils/logger";

export async function errorJson(err: any, _: Request, res: Response, next: NextFunction) {

    LOGGER.error(err);
    // Default values
    let status = 500;
    let message = "Internal Server Error";
    let details: any = undefined;

    /**
     * Zod validation error
     */
    if (err instanceof ZodError) {
        status = 400;
        message = "Validation error";

        details = err.issues.map(issue => {
            const field = issue.path.join(".");
            const data = {
                message: issue.message,
            };
            if (field) {
                Object.assign(data, { field });
            }
            return data;
        });

        return res.status(status).json({
            success: false,
            message,
            status,
            details,
        });
    }

    if (err instanceof Exception) {
        return res.status(err.status).json({
            success: false,
            message: err.message,
            status: err.status || status,
            details: err.details,
            ...(err.type ? { type: err.type } : {})
        });
    }

    if (err instanceof Error && err.name === "AbortError") {
        status = 499;
        message = "Client Closed Request";
    }
    if (err instanceof Error) {
        const match = err.message.match(/^(\d+):\s*(.*)$/);

        if (match) {
            const code = Number(match[1]);
            if (code >= 400 && code < 600) {
                status = code;
                message = match[2] || message;
            }
        } else {
            message = err.message;
        }

    }

    /**
     * Custom HTTP error (your own throws)
     * e.g. throw Object.assign(new Error("Not found"), { status: 404 })
     */
    if (err?.status && typeof err.status === "number") {
        status = err.status;
        message = err.message || message;
    }

    return res.status(status).json({
        success: false,
        status,
        message,
        ...(details ? { details } : {}),
    });
}

export async function notFoundJson(req: Request, res: Response, next: NextFunction) {
    res.status(404).json({ 
        success: false,
        message: "Resource not found",
        status: 404,
        type: "NOT_FOUND"
    });
}