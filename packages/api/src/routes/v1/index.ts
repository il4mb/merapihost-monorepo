import { serviceMiddleware, authMiddleware } from "@/middlewares";
import { Router } from "express";
import authRouter from "./auth";
import serviceRouter from "./service";
import serverRouter from "./server";
import websiteRouter from "./websites";
import domainRouter from "./domains";

const router = Router();
router.use("/auth", authRouter);

const authenticatedRouter = Router();
authenticatedRouter.use("/servers", serverRouter);
authenticatedRouter.use("/websites", websiteRouter);
authenticatedRouter.use("/domains", domainRouter);
authenticatedRouter.use("/:serviceId", serviceMiddleware, serviceRouter);

router.use(authMiddleware, authenticatedRouter);

export default router;