import * as websiteController from "@/controllers/websites";
import { websiteOwnerMiddleware } from "@/middlewares";
import { Router } from "express";

const router = Router();
router.get("/", websiteController.listWebsites);
router.post("/", websiteController.createWebsite);

const websiteRoute = Router();
websiteRoute.get("/", websiteController.getWebsite);
websiteRoute.put("/", websiteController.updateWebsite);
websiteRoute.delete("/", websiteController.deleteWebsite);

router.use("/:id", websiteOwnerMiddleware, websiteRoute);

export default router;