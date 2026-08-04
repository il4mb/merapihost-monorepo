import { serviceMiddleware, authMiddleware } from "@/middlewares";
import { Router } from "express";
import authRouter from "./auth";
import serviceRouter from "./service";
import serverRouter from "./server";
import websiteRouter from "./websites";
import domainRouter from "./domains";
import driveRouter from "./drive";

const router = Router();
router.use("/auth", authRouter);

const authenticatedRouter = Router();
authenticatedRouter.use("/services", serviceRouter);

authenticatedRouter.use("/servers", serverRouter);
authenticatedRouter.use("/websites", websiteRouter);
authenticatedRouter.use("/domains", domainRouter);
authenticatedRouter.use("/drives", driveRouter);


router.use(authMiddleware, authenticatedRouter);

export default router;