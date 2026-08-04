import { Router } from "express";
import * as controllers from "@/controllers/services";

const router = Router();

router.get("/", controllers.getListService);
export default router;