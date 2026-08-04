import * as controllers from "@/controllers/drives";
import { driveMiddleware, driveNodeMiddleware } from "@/middlewares";
import { Router } from "express";

const router = Router();


const driveRouter = Router();
driveRouter.get("/", controllers.getListFilesAndFolders);
driveRouter.post("/folders", controllers.createNodeFolder);


const driveNodeRouter = Router();
driveNodeRouter.get("/details/:nodeId", driveNodeMiddleware, controllers.getNodeById);
driveNodeRouter.put("/rename/:nodeId", driveNodeMiddleware, controllers.renameNode);
driveNodeRouter.delete("/delete/:nodeId", driveNodeMiddleware, controllers.deleteNode);
driveNodeRouter.post("/move/:nodeId", driveNodeMiddleware, controllers.moveNode);
driveNodeRouter.post("/copy/:nodeId", driveNodeMiddleware, controllers.copyNode);


driveRouter.use(driveNodeRouter);

router.use("/:id", driveMiddleware, driveRouter);

export default router;