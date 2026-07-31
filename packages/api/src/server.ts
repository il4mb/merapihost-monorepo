import "reflect-metadata";
import { createServer } from "http";
import app from "@/app";
import { env } from "@/config/env";
import { LOGGER } from "@/utils/logger";

LOGGER.info("Starting server...");

const PORT = env.PORT || 4000;
const httpServer = createServer(app);
httpServer.listen(PORT, () => {
    LOGGER.info(`Server is running on port ${PORT}`);
});