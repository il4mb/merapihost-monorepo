import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { WhatsappConversation } from "./whatsapp-conversation";

export enum MessageType {
    TEXT = "text",
    IMAGE = "image",
    VIDEO = "video",
    AUDIO = "audio",
    DOCUMENT = "document",
    STICKER = "sticker",
    LOCATION = "location",
    CONTACTS = "contacts",
    BUTTON = "button",
    INTERACTIVE = "interactive",
    TEMPLATE = "template",
    REACTION = "reaction",
    UNKNOWN = "unknown"
}

export enum MessageStatus {
    SENT = "sent",
    DELIVERED = "delivered",
    READ = "read",
    FAILED = "failed",
    RECEIVED = "received"
}

export interface MessageMedia {
    animated?: boolean;
    type: "image" | "video" | "audio" | "document" | "sticker";
    id: string;
}

@Entity("whatsapp_messages")
export class WhatsappMessage {

    @PrimaryGeneratedColumn("uuid")
    id!: string;

    @ManyToOne(() => WhatsappConversation, c => c.id, { onDelete: "CASCADE" })
    @JoinColumn({ name: "conversation_id" })
    conversation!: WhatsappConversation;

    @Column({ name: "whatsapp_message_id", unique: true })
    whatsappMessageId!: string;

    @Column({ name: "sender_wa_id", length: 32 })
    senderWaId!: string;

    @Column({ type: "enum", enum: MessageType })
    type!: MessageType;

    @Column({ type: "text", nullable: true })
    body?: string | null;

    @Column({ type: "json", nullable: true })
    media?: MessageMedia | null;

    @Column({ name: "reply_to_message_id", nullable: true })
    replyToMessageId?: string;

    @Column({ name: "sent_at", type: "datetime" })
    sentAt!: Date;

    @Column({ name: "status", type: "enum", enum: MessageStatus, default: MessageStatus.SENT })
    status!: MessageStatus;
}