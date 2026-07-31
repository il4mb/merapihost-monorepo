import { env } from "@/config/env";
import { formatUptime, formatBytes } from "@/utils/formatter";
import { Request, Response } from "express";
import os from "os";

export const getInfo = async (req: Request, res: Response) => {

    const cpus = os.cpus();
    const memoryUsage = process.memoryUsage();

    const stats = {
        status: "online",
        name: env.SERVER_NAME,
        timestamp: new Date().toISOString(),
        system: {
            platform: os.platform(),
            architecture: os.arch(),
            osRelease: os.release(),
            serverUptime: process.uptime(),
            formattedServerUptime: formatUptime(os.uptime()),
        },
        process: {
            // In PM2 cluster mode, this shows the specific worker's PID
            pid: process.pid,
            workerUptime: process.uptime(),
            formattedWorkerUptime: formatUptime(process.uptime()),
            nodeVersion: process.version,
        },
        memory: {
            // Physical server/container memory
            totalSystem: os.totalmem(),
            formattedTotalSystem: formatBytes(os.totalmem()),

            freeSystem: os.freemem(),
            formattedFreeSystem: formatBytes(os.freemem()),

            usedSystem: os.totalmem() - os.freemem(),
            formattedUsedSystem: formatBytes(os.totalmem() - os.freemem()),
            // Specific memory used by this Bun/Node process
            processRss: memoryUsage.rss,
            formattedProcessRss: formatBytes(memoryUsage.rss),

            processHeapUsed: memoryUsage.heapUsed,
            formattedProcessHeapUsed: formatBytes(memoryUsage.heapUsed),
        },
        cpu: {
            cores: cpus.length,
            model: cpus[0]?.model,
            // Load average over 1, 5, and 15 minutes
            loadAverage: {
                "1m": os.loadavg()[0].toFixed(2),
                "5m": os.loadavg()[1].toFixed(2),
                "15m": os.loadavg()[2].toFixed(2),
            }
        }
    };

    res.status(200).json({
        success: true,
        data: stats
    });
}