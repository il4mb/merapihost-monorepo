import { env } from "@/config/env";
import { formatUptime, formatBytes } from "@/utils/formatter";
import { Request, Response } from "express";
import os from "os";
import fs from "fs/promises"; // Import the file system promises module

export const getInfo = async (req: Request, res: Response) => {

    const cpus = os.cpus();
    const memoryUsage = process.memoryUsage();
    
    // Get disk stats for the partition where the app is running
    const stat = await fs.statfs(process.cwd());
    
    // Calculate storage in bytes (bsize = block size)
    const totalStorage = stat.blocks * stat.bsize;
    const freeStorage = stat.bfree * stat.bsize;
    const usedStorage = totalStorage - freeStorage;

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
            pid: process.pid,
            workerUptime: process.uptime(),
            formattedWorkerUptime: formatUptime(process.uptime()),
            nodeVersion: process.version,
        },
        storage: {
            totalStorage: totalStorage,
            formattedTotalStorage: formatBytes(totalStorage),
            freeStorage: freeStorage,
            formattedFreeStorage: formatBytes(freeStorage),
            usedStorage: usedStorage,
            formattedUsedStorage: formatBytes(usedStorage),
        },
        memory: {
            totalSystem: os.totalmem(),
            formattedTotalSystem: formatBytes(os.totalmem()),

            freeSystem: os.freemem(),
            formattedFreeSystem: formatBytes(os.freemem()),

            usedSystem: os.totalmem() - os.freemem(),
            formattedUsedSystem: formatBytes(os.totalmem() - os.freemem()),
            
            processRss: memoryUsage.rss,
            formattedProcessRss: formatBytes(memoryUsage.rss),

            processHeapUsed: memoryUsage.heapUsed,
            formattedProcessHeapUsed: formatBytes(memoryUsage.heapUsed),
        },
        cpu: {
            cores: cpus.length,
            model: cpus[0]?.model,
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