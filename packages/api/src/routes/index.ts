import { Router } from "express";
import webhookRouter from "./webhook";
import authRouter from "./auth";
import { welcome } from "../controllers/welcome";

const router = Router();

router.get("/", welcome);
router.use("/auth", authRouter);
router.use("/webhook", webhookRouter);

export default router;