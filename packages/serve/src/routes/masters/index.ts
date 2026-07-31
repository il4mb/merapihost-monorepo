import { Router } from "express";
import { masterVerifyMiddleware } from "@/middleware/masters/masterVerify";
import { errorJson, notFoundJson } from "@/middleware/errorHandler";
import systemRoutes from "./system";
import websiteRoutes from "./website";

const router = Router();
router.use(masterVerifyMiddleware);

router.use("/system", systemRoutes);
router.use("/websites", websiteRoutes);

router.use(notFoundJson);
router.use(errorJson);

export default router;