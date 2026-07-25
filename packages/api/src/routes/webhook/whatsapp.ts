import { Router } from "express";
import * as whatsappController from "@/controllers/webhook/whatsapp";

const router = Router();
router.get("/", whatsappController.verifyWebhook);
router.post("/", whatsappController.handleWebhook);

export default router;