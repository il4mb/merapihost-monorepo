import { Router } from "express";
import * as controller from "@/controllers/masters/website";
import { serviceWebsiteMiddleware } from "@/middleware/masters/serviceMiddle";
import webpageRoutes from "./webpage";

const router = Router();

// Root routes
router.get("/", controller.queryWebsite);
router.post("/", controller.createWebsite);

// 1. Create the nested router and enable mergeParams so it can read req.params.id
const websiteRouter = Router();

// 2. Define the nested routes
websiteRouter.put("/", controller.updateWebsite);
websiteRouter.delete("/", controller.deleteWebsite);
websiteRouter.get("/", controller.getWebsite);
websiteRouter.put("/domain-verify-token", controller.regenerateDomainVerifyToken);
websiteRouter.use("/webpages", webpageRoutes);

// 3. Mount the middleware and the router instance directly
router.use("/:id", serviceWebsiteMiddleware, websiteRouter);

export default router;