import { Router } from "express";
import * as whatsappController from "@/controllers/whatsapp/message";

const router = Router();

router.post("/send", whatsappController.handleSendMessage);

export default router;