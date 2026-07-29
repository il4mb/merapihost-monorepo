import { env } from "@/config/env";
import { getConnection } from "@/connection";
import { WhatsappAccount } from "@/entities/whatsapp-account";
import { WhatsappContact } from "@/entities/whatsapp-contact";
import { WhatsappConversation } from "@/entities/whatsapp-conversation";
import { MessageMedia, MessageStatus, MessageType, WhatsappMessage } from "@/entities/whatsapp-message";
import { InputBody } from "@/types/whatsapp";
import { LOGGER } from "@/utils/logger";
import { s3Client } from "@/utils/s3-client";
import { bootQueue } from "@/workers/boot.queue";
import { Request, Response } from "express";
import { Repository } from "typeorm";

async function getOrCreateContact(repo: Repository<WhatsappContact>, account: WhatsappAccount, waId: string, profileName?: string | null, userId?: string): Promise<WhatsappContact> {

    let contact = await repo.findOne({ where: { waId, account: { id: account.id } } });
    if (contact) {
        // Update the name if it's provided and different from the existing name
        if (profileName && (profileName !== contact.name || userId !== contact.userId)) {
            contact.name = profileName;
            contact.userId = userId;
            await repo.update(contact.id, { name: profileName, userId });
        }
        return contact;
    }
    
    try {
        contact = new WhatsappContact();
        contact.account = account;
        contact.waId = waId;
        contact.name = profileName || null;
        contact.userId = userId;
        return await repo.save(contact);
    } catch (error) {
        // If it fails due to a concurrent insert (Duplicate Key Error), fetch it again
        contact = await repo.findOne({ where: { waId, account: { id: account.id } } });
        if (contact) return contact;
        throw error;
    }
}

async function getOrCreateConversation(repo: Repository<WhatsappConversation>, account: WhatsappAccount, contact: WhatsappContact): Promise<WhatsappConversation> {
    let conversation = await repo.findOne({ where: { account: { id: account.id }, contact: { id: contact.id } } });
    if (conversation) return conversation;

    try {
        conversation = new WhatsappConversation();
        conversation.account = account;
        conversation.contact = contact;
        return await repo.save(conversation);
    } catch (error) {
        // If it fails due to a concurrent insert, fetch it again
        conversation = await repo.findOne({ where: { account: { id: account.id }, contact: { id: contact.id } } });
        if (conversation) return conversation;
        throw error;
    }
}


export const verifyWebhook = (req: Request, res: Response) => {
    const mode = req.query["hub.mode"];
    const token = req.query["hub.verify_token"];
    const challenge = req.query["hub.challenge"];

    if (mode === "subscribe" && token === env.WHATSAPP_CALLBACK_VERIFY_CODE) {
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
                    if (change.field === 'messages' && value.messages && value.messages.length > 0) {
                        for (const message of value.messages) {
                            const waId = message.from;
                            const foundContact = incomingContacts.find(c => c.wa_id === waId);

                            // Safe Concurrent Creation
                            const contact = await getOrCreateContact(
                                contactRepository,
                                account,
                                waId,
                                foundContact?.profile?.name,
                                foundContact?.user_id
                            );

                            // Safe Concurrent Creation
                            const conversation = await getOrCreateConversation(
                                conversationRepository,
                                account,
                                contact
                            );

                            const whatsappMessage = new WhatsappMessage();
                            whatsappMessage.conversation = conversation;
                            whatsappMessage.whatsappMessageId = message.id;
                            whatsappMessage.senderWaId = message.from;
                            whatsappMessage.type = message.type as any;
                            whatsappMessage.body = 'text' in message ? message.text.body : null;
                            whatsappMessage.sentAt = new Date(parseInt(message.timestamp) * 1000);
                            whatsappMessage.status = 'received' as MessageStatus;

                            if (message.context) {
                                whatsappMessage.replyToMessageId = message.context.id;
                            }

                            // --- MEDIA HANDLING ---
                            let mediaPayload: { id: string; url?: string; mime_type: string; caption?: string } | undefined;

                            switch (message.type) {
                                case 'image': mediaPayload = (message as any).image; break;
                                case 'video': mediaPayload = (message as any).video; break;
                                case 'audio': mediaPayload = (message as any).audio; break;
                                case 'document': mediaPayload = (message as any).document; break;
                                case 'sticker': mediaPayload = (message as any).sticker; break;
                            }

                            if (mediaPayload) {
                                if (mediaPayload.caption) whatsappMessage.body = mediaPayload.caption;

                                if (mediaPayload.url) {
                                    try {
                                        const response = await fetch(mediaPayload.url, {
                                            headers: { Authorization: `Bearer ${account.accessToken}` },
                                        });

                                        if (response.ok) {
                                            const buffer = Buffer.from(await response.arrayBuffer());
                                            const s3File = s3Client.file(`/whatsapp/${account.id}/${mediaPayload.id}`);
                                            await s3File.write(buffer, { type: mediaPayload.mime_type, acl: 'public-read' });

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
                            await messageRepository.save(whatsappMessage);

                            if (message.type === 'text') {
                                bootQueue.add('process-text-message', {
                                    accountId: account.id,
                                    contactId: contact.id,
                                    messageId: whatsappMessage.id
                                });
                            }
                        }
                    }

                    // ==========================================
                    // 2. HANDLE MESSAGE ECHOES (SMB App Sent Messages)
                    // ==========================================
                    if (change.field === 'smb_message_echoes' && value.message_echoes && value.message_echoes.length > 0) {
                        for (const message of value.message_echoes) {
                            const waId = (message as any).to;
                            if (!waId) continue;

                            // Safe Concurrent Creation
                            const contact = await getOrCreateContact(contactRepository, account, waId);
                            const conversation = await getOrCreateConversation(conversationRepository, account, contact);

                            const whatsappMessage = new WhatsappMessage();
                            whatsappMessage.conversation = conversation;
                            whatsappMessage.whatsappMessageId = message.id;
                            whatsappMessage.senderWaId = message.from;
                            whatsappMessage.type = message.type as MessageType;
                            whatsappMessage.body = 'text' in message ? message.text.body : null;
                            whatsappMessage.sentAt = new Date(parseInt(message.timestamp) * 1000);
                            whatsappMessage.status = 'sent' as MessageStatus;

                            if (message.context) {
                                whatsappMessage.replyToMessageId = message.context.id;
                            }

                            await messageRepository.save(whatsappMessage);
                            LOGGER.info(`Saved SMB message echo to conversation ${conversation.id}`);
                        }
                    }

                    // ==========================================
                    // 3. HANDLE MESSAGE STATUS UPDATES
                    // ==========================================
                    if (change.field === 'messages' && value.statuses && value.statuses.length > 0) {
                        for (const status of value.statuses) {
                            const existingMessage = await messageRepository.findOne({
                                where: { whatsappMessageId: status.id }
                            });

                            if (existingMessage) {
                                existingMessage.status = status.status as MessageStatus;
                                await messageRepository.save(existingMessage);
                            } else {
                                LOGGER.warn(`Received status update (${status.status}) for unknown message ID: ${status.id}`);
                            }
                        }
                    }

                    // ==========================================
                    // 4. HANDLE SMB APP STATE SYNC
                    // ==========================================
                    if (change.field === 'smb_app_state_sync' && value.state_sync && value.state_sync.length > 0) {
                        for (const syncEvent of value.state_sync) {
                            if (syncEvent.type === 'contact' && syncEvent.contact) {
                                const phone = syncEvent.contact.phone_number;

                                // Safe Concurrent Creation
                                const contact = await getOrCreateContact(contactRepository, account, phone);

                                // Update the name with what the business owner saved in their app
                                contact.name = syncEvent.contact.full_name || syncEvent.contact.first_name || contact.name;

                                await contactRepository.save(contact);
                                LOGGER.info(`SMB App State Sync: Synced contact ${phone} (Action: ${syncEvent.action})`);
                            }
                        }
                    }

                }
            }
        }
    } catch (error) {
        LOGGER.error("Fatal error processing WhatsApp Webhook:", error);
    }

    return res.sendStatus(200);
};