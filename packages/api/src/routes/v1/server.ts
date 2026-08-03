import { Router } from "express";
import * as controller from "@/controllers/server";
import { serverMiddleware } from "@/middlewares";

const router = Router();
router.get("/", controller.listServers);
router.post("/", controller.createServer);

const serverRouter = Router();
serverRouter.get("/", controller.getServer);
serverRouter.put("/", controller.updateServer);
serverRouter.delete("/", controller.deleteServer);

router.use("/:id", serverMiddleware, serverRouter);

export default router;