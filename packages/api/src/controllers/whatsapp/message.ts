import { getConnection } from "@/sources/connection";
import { WhatsappAccount } from "@/sources/entities/whatsapp-account";
import { WhatsappContact } from "@/sources/entities/whatsapp-contact";
import { WhatsappConversation } from "@/sources/entities/whatsapp-conversation";
import { MessageMedia, WhatsappMessage } from "@/sources/entities/whatsapp-message";
import { sendMessageSchema } from "@/sources/schemas/whatsapp";
import { Exception } from "@/utils/exception";
import { LOGGER } from "@/utils/logger";
import { Request, Response } from "express";

const ENDPOINT = "https://graph.facebook.com/v25.0";

export const handleSendMessage = async (req: Request, res: Response) => {
    throw new Exception({
        message: "This endpoint is deprecated. Please use the new WhatsApp API endpoint.",
        status: 410,
        type: "DEPRECATED_ENDPOINT",
    });
    try {
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

        let contact: WhatsappContact | null = null;
        let targetWaId: string;

        // Resolve Contact logic (Find by ID, or Find/Create by phone number)
        if (payload.contactId) {
            contact = await contactRepo.findOne({
                where: { id: payload.contactId, account: { id: account.id } }
            });
            if (!contact) return res.status(404).json({ error: "Contact not found" });
            targetWaId = contact.waId;
        } else if (payload.phoneNumber) {
            // Strip any non-numeric characters (like + or spaces) from the payload
            targetWaId = payload.phoneNumber.replace(/\D/g, '');

            contact = await contactRepo.findOne({
                where: { waId: targetWaId, account: { id: account.id } }
            });

            // If this is a brand new number, create a contact for them so the DB relations work
            if (!contact) {
                contact = new WhatsappContact();
                contact.account = account;
                contact.waId = targetWaId;
                await contactRepo.save(contact);
            }
        } else {
            return res.status(400).json({ error: "contactId or phoneNumber is required" });
        }

        // 3. Build WhatsApp API Payload
        const waPayload: any = {
            messaging_product: "whatsapp",
            recipient_type: "individual",
            to: targetWaId,
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
            conversation.contact = contact; // Guaranteed to exist now
            await conversationRepo.save(conversation);
        }

        const whatsappMessage = new WhatsappMessage();
        whatsappMessage.conversation = conversation;
        whatsappMessage.whatsappMessageId = waMessageId;
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

    } catch (error: any) {
        LOGGER.error("Error sending message:", error);

        if (error.name === "ZodError") {
            return res.status(400).json({
                error: "Validation Error",
                details: error.errors
            });
        }

        return res.status(500).json({ error: "Internal Server Error" });
    }
};