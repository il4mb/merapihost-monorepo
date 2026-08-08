import * as controller from "@/controllers/websites/webpage";
import { webpageMiddleware } from "@/middlewares";
import { Router } from "express";

const router = Router();
router.get("/", controller.listWebpages);
router.post("/", controller.createWebpage);

const websiteRoute = Router();
websiteRoute.get("/", controller.getWebpage);
websiteRoute.put("/", controller.updateWebpage);
websiteRoute.delete("/", controller.deleteWebpage);

// Nested route for a specific webpage
router.use("/:id", webpageMiddleware, websiteRoute);

export default router;