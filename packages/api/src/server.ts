import "reflect-metadata";
import "@/utils/cache";
import { createServer } from "http";
import { env } from "@/config/env";
import { LOGGER } from "@/utils/logger";
import app from "@/app";


LOGGER.info("Starting server...");

const PORT = env.PORT || 4000;
const httpServer = createServer(app);
httpServer.listen(PORT, () => {
    LOGGER.info(`Server is running on port ${PORT}`);
});