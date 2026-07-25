import { Router } from "express";
import webhookRouter from "./webhook";
import { welcome } from "../controllers/welcome";

const router = Router();

router.get("/", welcome);
router.use("/webhook", webhookRouter);

export default router;