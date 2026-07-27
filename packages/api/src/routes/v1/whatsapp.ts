import { Router } from "express";
import * as whatsappController from "@/controllers/whatsapp";

const router = Router();

router.post("/send", whatsappController.handleSendMessage);

export default router;