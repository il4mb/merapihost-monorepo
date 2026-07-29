import { Router } from "express";
import whatsappRouter from "./whatsapp";
import { whatsappAccountMiddleware } from "@/middlewares/whatsappAccount.middleware";

const router = Router();

router.use("/whatsapp/:accountId", whatsappAccountMiddleware, whatsappRouter);

export default router;