import { Router } from "express";
import serviceRouter from "./service";
import { serviceMiddleware } from "@/middlewares/service.middleware";

const router = Router();
router.use("/:serviceId", serviceMiddleware, serviceRouter);
export default router;