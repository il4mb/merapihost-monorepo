import { env } from "../config/env";
import { DataSource } from "typeorm";
import { LOGGER } from "./logger";
import path from "path";

try {
    import("mysql2");
} catch (error) {
    LOGGER.error("Please install mysql2 package to use MySQL database.");
    process.exit(1);
}

const snapshoots = {
    main: new DataSource({
        type: "mysql",
        host: env.MYSQL_HOST,
        port: env.MYSQL_PORT,
        username: env.MYSQL_USER,
        password: env.MYSQL_PASSWORD,
        database: env.MYSQL_DATABASE,
        synchronize: env.NODE_ENV === "development",
        entities: [
            path.join(__dirname, "entities", "**", "*.ts")
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
    })
} as const;

const databaseNames = Object.keys(snapshoots) as Array<keyof typeof snapshoots>;
type DatabaseName = typeof databaseNames[number];
export async function getConnection(database: DatabaseName = "main"): Promise<DataSource> {
    if (!snapshoots[database]) {
        throw new Error(`Database connection '${database}' is not defined.`);
    }
    if (!snapshoots[database].isInitialized) {
        await snapshoots[database].initialize();
    }
    return snapshoots[database];
}

// Initialize connections immediately
for (const key in snapshoots) {
    getConnection(key as keyof typeof snapshoots).then(() => {
        LOGGER.info(`Database connection '${key}' initialized.`);
    }).catch((error) => {
        LOGGER.error(`Failed to initialize database connection '${key}':`, error);
        process.exit(1);
    });
}

const shutdown = () => {
    LOGGER.info("Shutting down database connections...");
    for (const key in snapshoots) {
        const ds = snapshoots[key as keyof typeof snapshoots];
        if (ds && ds.isInitialized) {
            ds.destroy();
            LOGGER.info(`Database connection '${key}' closed.`);
        }
    }

    process.exit(0);

}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);