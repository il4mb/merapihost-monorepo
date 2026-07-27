import { getConnection } from "@/connection";
import { WhatsappAccount } from "@/entities/whatsapp-account";
import { WhatsappContact } from "@/entities/whatsapp-contact";
import { WhatsappConversation } from "@/entities/whatsapp-conversation";
import { MessageMedia, WhatsappMessage } from "@/entities/whatsapp-message";
import { sendMessageSchema } from "@/schemas/whatsapp";
import { LOGGER } from "@/utils/logger";
import { Request, Response } from "express";

const ENDPOINT = "https://graph.facebook.com/v25.0";

export const handleSendMessage = async (req: Request, res: Response) => {

    // 1. Validate Input
    const payload = sendMessageSchema.parse(req.body);

    // 2. Fetch Entities
    const db = await getConnection();
    const accountRepo = db.getRepository(WhatsappAccount);
    const contactRepo = db.getRepository(WhatsappContact);
    const conversationRepo = db.getRepository(WhatsappConversation);
    const messageRepo = db.getRepository(WhatsappMessage);

    const account = await accountRepo.findOne({ where: { id: payload.accountId } });
    if (!account) return res.status(404).json({ error: "Account not found" });

    const contact = await contactRepo.findOne({
        where: { id: payload.contactId, account: { id: account.id } }
    });
    if (!contact) return res.status(404).json({ error: "Contact not found" });

    // 3. Build WhatsApp API Payload
    const waPayload: any = {
        messaging_product: "whatsapp",
        recipient_type: "individual",
        to: contact.waId,
        type: payload.type,
    };

    if (payload.replyToMessageId) {
        waPayload.context = { message_id: payload.replyToMessageId };
    }

    if (payload.type === "text") {
        waPayload.text = { preview_url: true, body: payload.body };
    } else {
        const mediaObj: any = {};

        if (payload.mediaId) {
            mediaObj.id = payload.mediaId;
        } else if (payload.mediaLink) {
            mediaObj.link = payload.mediaLink;
        }

        // If a body is provided with media, WhatsApp treats it as a caption (except for audio/stickers)
        if (payload.body && !["audio", "sticker"].includes(payload.type)) {
            mediaObj.caption = payload.body;
        }

        waPayload[payload.type] = mediaObj;
    }

    // 4. Send to Meta Graph API
    const graphUrl = `${ENDPOINT}/${account.phoneNumberId}/messages`;
    const response = await fetch(graphUrl, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${account.accessToken}`,
        },
        body: JSON.stringify(waPayload),
    });

    const data = await response.json();

    if (!response.ok) {
        LOGGER.error("WhatsApp API Error:", data);
        return res.status(400).json({ error: "Failed to send message via WhatsApp API", details: data });
    }

    const waMessageId = data.messages?.[0]?.id;

    // 5. Save to Database
    let conversation = await conversationRepo.findOne({
        where: { account: { id: account.id }, contact: { id: contact.id } }
    });

    if (!conversation) {
        conversation = new WhatsappConversation();
        conversation.account = account;
        conversation.contact = contact;
        await conversationRepo.save(conversation);
    }

    const whatsappMessage = new WhatsappMessage();
    whatsappMessage.conversation = conversation;
    whatsappMessage.whatsappMessageId = waMessageId;
    // Using the account's phone number ID as the sender identifier for outbound messages
    whatsappMessage.senderWaId = account.phoneNumberId;
    whatsappMessage.type = payload.type as any;
    whatsappMessage.body = payload.body || null;
    whatsappMessage.sentAt = new Date();

    if (payload.replyToMessageId) {
        whatsappMessage.replyToMessageId = payload.replyToMessageId;
    }

    if (payload.type !== "text") {
        whatsappMessage.media = {
            id: payload.mediaId || null,
            url: payload.mediaLink || null,
            type: payload.type
        } as MessageMedia;
    }

    await messageRepo.save(whatsappMessage);

    return res.status(200).json({
        success: true,
        messageId: waMessageId
    });
}