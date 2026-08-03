import { Router } from "express";
import * as controller from "@/controllers/server";
import { serverMiddleware, adminMiddleware } from "@/middlewares";

const router = Router();
router.get("/", controller.listServers);
router.post("/", adminMiddleware, controller.createServer);

const serverRouter = Router();
serverRouter.get("/", controller.getServer);
serverRouter.put("/", adminMiddleware, controller.updateServer);
serverRouter.delete("/", adminMiddleware, controller.deleteServer);

router.use("/:id", serverMiddleware, serverRouter);

export default router;