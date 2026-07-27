import { Router } from "express";
import whatsappRouter from "./whatsapp";

const router = Router();

router.use("/whatsapp", whatsappRouter);

export default router;