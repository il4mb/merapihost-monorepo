import { env } from "../config/env";
import { DataSource } from "typeorm";
import { LOGGER } from "./logger";
import { Service } from "./entities/service";
import { Webpage } from "./entities/webpage";

try {
    import("mysql2");
} catch (error) {
    LOGGER.error("Please install mysql2 package to use MySQL database.");
    process.exit(1);
}

const snapshoots = new DataSource({
    type: "mysql",
    host: env.MYSQL_HOST,
    port: env.MYSQL_PORT,
    username: env.MYSQL_USER,
    password: env.MYSQL_PASSWORD,
    database: env.MYSQL_DATABASE,
    synchronize: env.NODE_ENV === "development",
    entities: [
        Service,
        Webpage
    ],
    subscribers: [],
    migrations: [],
    cache: {
        type: "ioredis",
        options: {
            host: env.REDIS_HOST,
            port: env.REDIS_PORT
        }
    }
});

if(!snapshoots.isInitialized) {
    snapshoots.initialize()
        .then(() => {
            LOGGER.info("Database connection established.");
        })
        .catch((err) => {
            LOGGER.error("Error during database connection initialization:", err);
            process.exit(1);
        });
}

export async function getConnection(): Promise<DataSource> {
    if (!snapshoots.isInitialized) {
        await snapshoots.initialize();
    }
    return snapshoots;
}

const shutdown = () => {
    LOGGER.info("Shutting down database connections...");
    for (const key in snapshoots) {
        if (snapshoots.isInitialized) {
            snapshoots.destroy();
            LOGGER.info(`Database connection '${key}' closed.`);
        }
    }

    process.exit(0);

}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);