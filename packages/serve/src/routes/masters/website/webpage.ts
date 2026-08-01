import { Router } from "express";
import * as controller from "@/controllers/masters/webpage";
import { webpageMiddleware } from "@/middleware/masters/webpageMiddle";

const router = Router();
router.get("/", controller.queryWebpage);
router.post("/", controller.createWebpage);

const webpageRouter = Router();
webpageRouter.put("/", controller.updateWebpage);
webpageRouter.delete("/", controller.deleteWebpage);
webpageRouter.get("/", controller.getWebpage);

router.use("/:id", webpageMiddleware, webpageRouter);

export default router;