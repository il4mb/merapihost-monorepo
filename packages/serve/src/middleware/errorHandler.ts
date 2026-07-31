import { ZodError } from "zod";
import { NextFunction, Request, Response } from "express";
import { Exception } from "@/utils/exception";
import { LOGGER } from "@/utils/logger";

export async function errorJson(err: any, _: Request, res: Response, next: NextFunction) {
    LOGGER.error(err);

    // Default values
    let status = 500;
    let message = "Internal Server Error";

    /**
     * Zod validation error
     */
    if (err instanceof ZodError) {
        status = 400;

        // Get the first error and count the rest
        const firstIssue = err.issues[0];
        const leftCount = err.issues.length - 1;

        const field = firstIssue.path.join(".");

        // Format the message with the first error
        message = field
            ? `${field}: ${firstIssue.message}`
            : firstIssue.message;

        // Append the remaining count if there are multiple errors
        if (leftCount > 0) {
            message += ` (and ${leftCount} more error${leftCount > 1 ? 's' : ''})`;
        }

        return res.status(status).json({
            success: false,
            status,
            message,
            type: "VALIDATION_ERROR",
        });
    }

    /**
     * Custom Exception
     */
    if (err instanceof Exception) {
        const response: Record<string, any> = {
            success: false,
            message: err.message,
            status: err.status || status,
            ...(err.type ? { type: err.type } : {})
        };

        return res.status(err.status || status).json(response);
    }

    if (err instanceof Error && err.name === "AbortError") {
        status = 499;
        message = "Client Closed Request";
    } else if (err instanceof Error) {
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