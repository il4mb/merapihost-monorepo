const script = Bun.main;
const isWorker = script?.includes("worker.js") || script?.includes("worker.ts");
const segment = isWorker ? "worker" : "server";

// Helper to get caller information
function getCallerInfo(): string {
    const stack = new Error().stack || '';
    const stackLines = stack.split('\n');

    // Find the first line that's not from this logger file
    for (let i = 3; i < stackLines.length; i++) {
        const line = stackLines[i].trim();
        if (line.includes(__filename)) continue;

        // Extract file and line info
        const match = line.match(/at (.+?) \((.+):(\d+):(\d+)\)/) ||
            line.match(/at (.+?):(\d+):(\d+)/);

        if (match) {
            if (match[2]) { // With function name
                const filePath = match[2];
                const lineNumber = match[3];
                const fileName = filePath.split('/').pop() || filePath;
                const functionName = match[1];
                return `${functionName} (${fileName}:${lineNumber})`;
            } else { // Without function name
                const filePath = match[1];
                const lineNumber = match[2];
                const fileName = filePath.split('/').pop() || filePath;
                return `${fileName}:${lineNumber}`;
            }
        }
    }

    return 'unknown';
}

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
        const caller = getCallerInfo();
        console.log(`[${segment}] [INFO] ${caller} - ${message}`, ...args);
    }

    export const error = (message: string | Error, error?: any) => {
        const caller = getCallerInfo();
        let formattedMessage = '';

        if (message instanceof Error) {
            formattedMessage = formatError(message);
            if (error) formattedMessage += `\nAdditional context: ${formatError(error)}`;
        } else {
            formattedMessage = message;
            if (error) formattedMessage += ` - ${formatError(error)}`;
        }

        console.error(`[${segment}] [ERROR] ${caller} - ${formattedMessage}`);
    }

    export const warn = (message: string, ...args: any[]) => {
        const caller = getCallerInfo();
        console.warn(`[${segment}] [WARN] ${caller} - ${message}`, ...args);
    }

    export const debug = (message: string, ...args: any[]) => {
        if (process.env.NODE_ENV !== 'production') {
            const caller = getCallerInfo();
            console.debug(`[${segment}] [DEBUG] ${caller} - ${message}`, ...args);
        }
    }

    export const trace = (message: string, ...args: any[]) => {
        if (process.env.NODE_ENV !== 'production') {
            const caller = getCallerInfo();
            const stack = new Error().stack || '';
            console.trace(`[${segment}] [TRACE] ${caller} - ${message}`, ...args);
            // Optionally log just the relevant part of the stack
            const relevantStack = stack.split('\n').slice(3).join('\n');
            console.debug(`[${segment}] [TRACE] Stack trace:\n${relevantStack}`);
        }
    }

    // Method for structured logging
    export const withContext = (context: Record<string, any>) => {
        return {
            info: (message: string, ...args: any[]) => {
                const caller = getCallerInfo();
                console.log(`[${segment}] [INFO] ${caller} - ${message}`,
                    { context, ...(args.length ? { data: args } : {}) });
            },
            error: (message: string | Error, error?: any) => {
                const caller = getCallerInfo();
                let formattedMessage = '';

                if (message instanceof Error) {
                    formattedMessage = formatError(message);
                    if (error) formattedMessage += `\nAdditional context: ${formatError(error)}`;
                } else {
                    formattedMessage = message;
                    if (error) formattedMessage += ` - ${formatError(error)}`;
                }

                console.error(`[${segment}] [ERROR] ${caller} - ${formattedMessage}`,
                    { context, error: error instanceof Error ? error.message : error });
            },
            warn: (message: string, ...args: any[]) => {
                const caller = getCallerInfo();
                console.warn(`[${segment}] [WARN] ${caller} - ${message}`,
                    { context, ...(args.length ? { data: args } : {}) });
            }
        };
    }
}