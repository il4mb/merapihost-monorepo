import { Router } from "express";
import * as systemController from "@/controllers/masters/system";

const router = Router();
router.get("/info", systemController.getInfo);
export default router;