import express from 'express';
import cors from 'cors';
import { LOGGER } from './utils/logger';
import path from 'path';
import { domainVerifyMiddleware } from './middleware/domainVerify';
import clientRoutes from './routes/client';
import { createProxyMiddleware } from "http-proxy-middleware";
import { env } from './config/env';
import { Service } from './entities/service';

const startTime = Date.now();

const bucketProxyMiddleware = createProxyMiddleware({
    target: "https://is3.cloudhost.id",
    changeOrigin: true,
    pathRewrite: (path, req) => {
        // @ts-ignore
        const service = req.service as Service | undefined;
        if (!service) {
            throw new Error("Service is not defined in the request.");
        }
        const bucket = service.bucket;
        console.log(`Proxying request for path: ${path} to bucket: ${bucket}`);
        if (!bucket) {
            throw new Error("Bucket is not defined for the service.");
        }
        if (path.startsWith("/favicon.ico")) {
            return `/${bucket}/assets/favicon.ico`;
        }
        return `/${bucket}${path}`;
    },
});

const app = express();
app.set('view engine', 'ejs');
app.set("trust proxy", true);
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/**
 * Serve static files from the "dist" directory
 * This allows the application to serve static assets such as JavaScript, CSS, and images.
 */
app.use(express.static('dist'));

/**
 * Set the views directory for EJS templates
 */
app.set('views', path.join(__dirname, 'views'));

/**
 * Middleware to log incoming requests and set response headers
 */
app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, QUERY, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.setHeader('X-Powered-By', 'Merapihost');
    const domain = req.hostname || "localhost";
    LOGGER.info(`Incoming request from domain: ${domain}, method: ${req.method}, path: ${req.path}`);
    next();
});


/**
 * Render the main index page for localhost requests
 */
app.get("/{*path}", (req, res, next) => {
    const domain = req.hostname || "localhost";
    if (domain.startsWith("localhost")) {
        if (req.path === "/favicon.ico") {
            // @ts-ignore assign a mock service object to the request for testing purposes
            req.service = { bucket: "merapihost" }
            return bucketProxyMiddleware(req, res, next);
        }
        return res.render("index", { serverName: env.SERVER_NAME, startTime: new Date(startTime).toISOString() });
    }
    next();
});

/**
 * Middleware to verify domain ownership using DNS TXT records
 */
app.use(domainVerifyMiddleware);

/**
 * Proxy middleware to handle requests to /favicon.ico and redirect them to the appropriate bucket based on the hostname
 * The path is rewritten to include the bucket name before forwarding the request to the target server.
 */
app.use("/favicon.ico", bucketProxyMiddleware);

/**
 * Proxy middleware to handle requests to /assets and redirect them to the appropriate bucket based on the hostname
 * If the hostname is "localhost", it will use the "merapihost" bucket, otherwise it will use the "testing" bucket.
 * The path is rewritten to include the bucket name before forwarding the request to the target server.
 */
app.use("/assets", bucketProxyMiddleware);

/**
 * Routes for client requests
 * These routes are defined in the clientRoutes module and handle various client-related endpoints.
 */
app.use(clientRoutes);

/**
 * Error handling middleware
 * This middleware catches any errors that occur during request processing and sends a JSON response with the error message.
 */
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    LOGGER.error(`Error occurred: ${err.message}`, err);
    res.status(err.status || 500).render("error", {
        error: err,
        serverName: env.SERVER_NAME
    });
});

export default app; 