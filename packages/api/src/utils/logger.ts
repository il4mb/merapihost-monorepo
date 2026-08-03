const script = Bun.main;
const isWorker = script?.includes("worker.js") || script?.includes("worker.ts");
const segment = isWorker ? "worker" : "server";

// Helper to format error objects
function formatError(error: any): string {
    if (!error) return '';

    if (error instanceof Error) {
        return `${error.message} ${error.stack ? `\n${error.stack}` : ''}`;
    }

    return String(error);
}

export namespace LOGGER {
    export const info = (message: string, ...args: any[]) => {
        console.log(`[${segment}] [INFO] - ${message}`, ...args);
    }

    export const error = (message: string | Error, error?: any) => {
        let formattedMessage = '';
        if (message instanceof Error) {
            formattedMessage = formatError(message);
            if (error) formattedMessage += `\nAdditional context: ${formatError(error)}`;
        } else {
            formattedMessage = message;
            if (error) formattedMessage += ` - ${formatError(error)}`;
        }

        console.error(`[${segment}] [ERROR] - ${formattedMessage}`);
    }

    export const warn = (message: string, ...args: any[]) => {
        console.warn(`[${segment}] [WARN] - ${message}`, ...args);
    }

    export const debug = (message: string, ...args: any[]) => {
        if (process.env.NODE_ENV !== 'production') {
            console.debug(`[${segment}] [DEBUG] - ${message}`, ...args);
        }
    }

    export const trace = (message: string, ...args: any[]) => {
        if (process.env.NODE_ENV !== 'production') {
            const stack = new Error().stack || '';
            console.trace(`[${segment}] [TRACE] - ${message}`, ...args);
            // Optionally log just the relevant part of the stack
            const relevantStack = stack.split('\n').slice(3).join('\n');
            console.debug(`[${segment}] [TRACE] Stack trace:\n${relevantStack}`);
        }
    }

    // Method for structured logging
    export const withContext = (context: Record<string, any>) => {
        return {
            info: (message: string, ...args: any[]) => {
                console.log(`[${segment}] [INFO] - ${message}`, { context, ...(args.length ? { data: args } : {}) });
            },
            error: (message: string | Error, error?: any) => {
                let formattedMessage = '';

                if (message instanceof Error) {
                    formattedMessage = formatError(message);
                    if (error) formattedMessage += `\nAdditional context: ${formatError(error)}`;
                } else {
                    formattedMessage = message;
                    if (error) formattedMessage += ` - ${formatError(error)}`;
                }

                console.error(`[${segment}] [ERROR] - ${formattedMessage}`, { context, error: error instanceof Error ? error.message : error });
            },
            warn: (message: string, ...args: any[]) => {
                console.warn(`[${segment}] [WARN] - ${message}`, { context, ...(args.length ? { data: args } : {}) });
            }
        };
    }
}