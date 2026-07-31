import { Router } from "express";
import * as controller from "@/controllers/masters/webpage";

const router = Router();
router.get("/", controller.queryWebpage);
router.post("/", controller.createWebpage);
router.put("/:id", controller.updateWebpage);
router.delete("/:id", controller.deleteWebpage);
router.get("/:id", controller.getWebpage);

export default router;