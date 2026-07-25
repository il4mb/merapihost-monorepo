import { env } from "@/config/env";
import { Request, Response } from "express";

export const verifyWebhook = (req: Request, res: Response) => {
    const mode = req.query["hub.mode"];
    const token = req.query["hub.verify_token"];
    const challenge = req.query["hub.challenge"];

    if (mode === "subscribe" && token === env.WHATSAPP_CALLBACK_VERIFY_TOKEN) {
        console.log("Webhook verified");
        return res.status(200).send(challenge);
    }

    return res.sendStatus(403);
};

export const handleWebhook = (req: Request, res: Response) => {
    console.log(req.body);

    return res.sendStatus(200);
};