import "reflect-metadata";
import { createServer } from "http";
import app from "@/app";
import { env } from "@/config/env";
import { LOGGER } from "@/utils/logger";

LOGGER.info("Starting server...");

const PORT = env.PORT || 4020;

app.listen(PORT, () => {
    LOGGER.info(`Server is running on port ${PORT}`);
    LOGGER.info(`Environment: ${env.NODE_ENV}`);
    LOGGER.info(`URL: http://localhost:${PORT}`);
});
