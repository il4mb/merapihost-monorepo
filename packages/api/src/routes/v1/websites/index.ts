import * as websiteController from "@/controllers/websites";
import { Router } from "express";

const router = Router();

router.get("/", websiteController.listWebsites);
router.post("/", websiteController.createWebsite);

export default router;