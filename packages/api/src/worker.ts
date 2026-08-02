// import bootWorker from "@/workers/boot.worker";

const WORKERS = [] as any[];

const shutdown = async () => {
    console.log("Shutting down workers...");
    for (const worker of WORKERS) {
        await worker.close();
        console.log(`Worker '${worker.name}' closed.`);
    }
};


for (const worker of WORKERS) {
    worker.on("ready", () => {
        console.log(`Worker '${worker.name}' is ready.`);
    });

    worker.on("active", (job) => {
        console.log(`[${worker.name}] Processing job ${job.id}`);
    });

    worker.on("completed", (job) => {
        console.log(`[${worker.name}] Completed job ${job.id}`);
    });

    worker.on("failed", (job, err) => {
        console.error(
            `[${worker.name}] Job ${job?.id} failed:`,
            err
        );
    });

    worker.on("error", (err) => {
        console.error(`[${worker.name}] Worker error:`, err);
    });
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);