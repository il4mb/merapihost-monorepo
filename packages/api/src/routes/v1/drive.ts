import * as controllers from "@/controllers/drives";
import { driveMiddleware } from "@/middlewares";
import { Router } from "express";

const router = Router();

router.get("/", controllers.listDrives);
router.post("/folders", controllers.createDriveFolder);

const driveRouter = Router();
driveRouter.get("/", controllers.getDriveById);
driveRouter.put("/", controllers.renameDrive);
driveRouter.delete("/", controllers.deleteDrive);
driveRouter.post("/move", controllers.moveDrive);
driveRouter.post("/copy", controllers.copyDrive);

router.use("/:id", driveMiddleware, driveRouter);

export default router;