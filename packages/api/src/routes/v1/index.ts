import { Router } from "express";
import authRouter from "./auth";
import serviceRouter from "./service";
import { serviceMiddleware } from "@/middlewares/service.middleware";

const router = Router();
router.use("/auth", authRouter);
router.use("/:serviceId", serviceMiddleware, serviceRouter);

export default router;