import { Router } from "express";
import webhookRouter from "./webhook";
import { welcome } from "../controllers/welcome";
import v1Router from "./v1";

const router = Router();

router.use("/v1", v1Router);

router.get("/", welcome);
router.use("/webhook", webhookRouter);

export default router;