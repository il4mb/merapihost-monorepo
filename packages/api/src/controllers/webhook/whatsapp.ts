import { env } from "@/config/env";
import { getConnection } from "@/connection";
import { WhatsappAccount } from "@/entities/whatsapp-account";
import { WhatsappContact } from "@/entities/whatsapp-contact";
import { WhatsappConversation } from "@/entities/whatsapp-conversation";
import { MessageMedia, MessageStatus, WhatsappMessage } from "@/entities/whatsapp-message";
import { InputBody } from "@/types/whatsapp";
import { LOGGER } from "@/utils/logger";
import { s3Client } from "@/utils/s3-client";
import { Request, Response } from "express";

export const verifyWebhook = (req: Request, res: Response) => {
    const mode = req.query["hub.mode"];
    const token = req.query["hub.verify_token"];
    const challenge = req.query["hub.challenge"];

    console.log("Webhook verification request received");

    if (mode === "subscribe" && token === env.WHATSAPP_CALLBACK_VERIFY_CODE) {
        console.log("Webhook verified");
        return res.status(200).send(challenge);
    }

    return res.sendStatus(403);
};

export const handleWebhook = async (req: Request, res: Response) => {
    try {
        const db = await getConnection();
        const accountRepository = db.getRepository(WhatsappAccount);
        const conversationRepository = db.getRepository(WhatsappConversation);
        const messageRepository = db.getRepository(WhatsappMessage);
        const contactRepository = db.getRepository(WhatsappContact);

        const body = req.body as InputBody;
        // console.log("Webhook event received:", JSON.stringify(body, null, 2));

        const { object, entry } = body;

        if (object === "whatsapp_business_account") {
            for (const entryItem of entry) {
                const changes = entryItem.changes;

                for (const change of changes) {
                    const value = change.value;
                    const phoneNumberId = value.metadata?.phone_number_id;

                    if (!phoneNumberId) continue;

                    const account = await accountRepository.findOne({ where: { phoneNumberId } });
                    const incomingContacts = value.contacts || [];

                    if (!account) {
                        LOGGER.error(`Whatsapp account with phone number ID ${phoneNumberId} not found`);
                        continue;
                    }

                    // ==========================================
                    // 1. HANDLE INCOMING MESSAGES
                    // ==========================================
                    const messages = value.messages;
                    if (messages && messages.length > 0) {
                        for (const message of messages) {
                            const waId = message.from;
                            let contact = await contactRepository.findOne({ where: { waId, account: { id: account.id } } });

                            // Create contact if it doesn't exist
                            if (!contact) {
                                const foundContact = incomingContacts.find(c => c.wa_id === waId);
                                contact = new WhatsappContact();
                                contact.account = account;
                                contact.waId = waId;
                                contact.userId = foundContact?.user_id || undefined;
                                contact.name = foundContact?.profile.name || null;
                                await contactRepository.save(contact);
                            }

                            // Create or get conversation
                            let conversation = await conversationRepository.findOne({ where: { account: { id: account.id }, contact: { id: contact.id } } });
                            if (!conversation) {
                                conversation = new WhatsappConversation();
                                conversation.account = account;
                                conversation.contact = contact;
                                await conversationRepository.save(conversation);
                            }

                            // Prepare the new message
                            const whatsappMessage = new WhatsappMessage();
                            whatsappMessage.conversation = conversation;
                            whatsappMessage.whatsappMessageId = message.id;
                            whatsappMessage.senderWaId = message.from;
                            whatsappMessage.type = message.type as any;
                            whatsappMessage.body = 'text' in message ? message.text.body : null;
                            whatsappMessage.sentAt = new Date(parseInt(message.timestamp) * 1000);

                            // You might want to default the status for incoming messages
                            whatsappMessage.status = 'received' as MessageStatus;

                            if (message.context) {
                                whatsappMessage.replyToMessageId = message.context.id;
                            }

                            // --- MEDIA HANDLING LOGIC ---
                            let mediaPayload: { id: string; url?: string; mime_type: string; caption?: string } | undefined;

                            switch (message.type) {
                                case 'image': mediaPayload = message.image; break;
                                case 'video': mediaPayload = message.video; break;
                                case 'audio': mediaPayload = message.audio; break;
                                case 'document': mediaPayload = message.document; break;
                                case 'sticker': mediaPayload = message.sticker; break;
                            }

                            if (mediaPayload) {
                                // If the media has a caption, use it as the message body
                                if (mediaPayload.caption) {
                                    whatsappMessage.body = mediaPayload.caption;
                                }

                                // If URL is present, download and save to S3
                                if (mediaPayload.url) {
                                    try {
                                        const response = await fetch(mediaPayload.url, {
                                            headers: {
                                                Authorization: `Bearer ${account.accessToken}`,
                                            },
                                        });

                                        if (response.ok) {
                                            const buffer = Buffer.from(await response.arrayBuffer());
                                            const s3File = s3Client.file(`/whatsapp/${account.id}/${mediaPayload.id}`);

                                            await s3File.write(buffer, {
                                                type: mediaPayload.mime_type,
                                                acl: 'public-read',
                                            });

                                            whatsappMessage.media = {
                                                id: mediaPayload.id,
                                                type: message.type
                                            } as MessageMedia;
                                        } else {
                                            LOGGER.error(`Failed to download media ${mediaPayload.id}: ${response.statusText}`);
                                        }
                                    } catch (error) {
                                        LOGGER.error(`Error processing media for message ${message.id}:`, error);
                                    }
                                }
                            }
                            // --- END MEDIA HANDLING LOGIC ---

                            await messageRepository.save(whatsappMessage);
                        }
                    }

                    // ==========================================
                    // 2. HANDLE MESSAGE STATUS UPDATES (Sent, Delivered, Read, Failed)
                    // ==========================================
                    const statuses = value.statuses;
                    if (statuses && statuses.length > 0) {
                        for (const status of statuses) {
                            // Find the original message we sent via its ID
                            const existingMessage = await messageRepository.findOne({
                                where: { whatsappMessageId: status.id }
                            });

                            if (existingMessage) {
                                // Update the status of the message
                                // Ensure you have a `status` column in your `WhatsappMessage` entity!
                                existingMessage.status = status.status as MessageStatus;

                                // Optional: You can track exact delivery times by adding fields like `deliveredAt` or `readAt`
                                // const statusTimestamp = new Date(parseInt(status.timestamp) * 1000);
                                // if (status.status === 'delivered') existingMessage.deliveredAt = statusTimestamp;
                                // if (status.status === 'read') existingMessage.readAt = statusTimestamp;

                                await messageRepository.save(existingMessage);
                                // LOGGER.info(`Updated message ${status.id} to status: ${status.status}`);
                            } else {
                                // Note: Depending on your architecture, you might receive statuses for messages 
                                // sent outside of this system. A warning is usually enough here.
                                LOGGER.warn(`Received status update (${status.status}) for unknown message ID: ${status.id}`);
                            }
                        }
                    }

                }
            }
        }
    } catch (error) {
        // Log the error but STILL return 200 below so Meta doesn't disable the webhook
        LOGGER.error("Fatal error processing WhatsApp Webhook:", error);
    }

    // ALWAYS return 200 to WhatsApp to acknowledge receipt
    return res.sendStatus(200);
};