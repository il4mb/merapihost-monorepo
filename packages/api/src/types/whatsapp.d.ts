export interface InputBody {
    object: string;
    entry: Entry[];
}

export interface StateSyncEvent {
    type: string;
    action: string;
    contact?: {
        full_name: string;
        first_name: string;
        phone_number: string;
    };
    metadata: {
        timestamp: string;
        version: number;
    };
}

export interface Entry {
    id: string;
    changes: Change[];
}

export interface Change {
    field: string;
    value: Value;
    smb_message_echoes?: any[];
    smb_app_state_sync?: any[];
}

export interface Value {
    messaging_product: string;
    metadata: Metadata;
    contacts?: Contact[];
    messages?: Message[];
    statuses?: Status[];
    errors?: WebhookError[];
    message_echoes?: Message[]; // Added for smb_message_echoes
    state_sync?: StateSyncEvent[]; // Added for smb_app_state_sync
}

export interface Metadata {
    display_phone_number: string;
    phone_number_id: string;
}

export interface Contact {
    profile: Profile;
    wa_id: string;
    user_id?: string;
}

export interface Profile {
    name: string;
}

// Added to handle WhatsApp status webhooks
export interface Status {
    id: string;
    recipient_id: string;
    status: "sent" | "delivered" | "read" | "failed" | "warning";
    timestamp: string;
    conversation?: {
        id: string;
        origin: {
            type: string;
        };
    };
    pricing?: {
        billable: boolean;
        pricing_model: string;
        category: string;
    };
    errors?: WebhookError[];
}

export interface WebhookError {
    code: number;
    title: string;
    message: string;
    error_data: {
        details: string;
    };
}

export interface BaseMessage {
    id: string;
    timestamp: string;
    from: string;
    from_user_id?: string;
    context?: { // Added: Useful for tracking replies
        from: string;
        id: string;
    };
}

export interface TextMessage extends BaseMessage {
    type: "text";
    text: {
        body: string;
    };
}

export interface ImageMessage extends BaseMessage {
    type: "image";
    image: {
        mime_type: string;
        sha256: string;
        id: string;
        url?: string; // Present when webhook includes media URL
        caption?: string;
    };
}

export interface VideoMessage extends BaseMessage {
    type: "video";
    video: {
        mime_type: string;
        sha256: string;
        id: string;
        url?: string;
        caption?: string;
    };
}

export interface AudioMessage extends BaseMessage {
    type: "audio";
    audio: {
        mime_type: string;
        sha256: string;
        id: string;
        url?: string;
    };
}

export interface DocumentMessage extends BaseMessage {
    type: "document";
    document: {
        filename?: string;
        mime_type: string;
        sha256: string;
        id: string;
        url?: string;
        caption?: string;
    };
}

export interface StickerMessage extends BaseMessage {
    type: "sticker";
    sticker: {
        mime_type: string;
        sha256: string;
        id: string;
        url?: string;
        animated?: boolean;
    };
}

export interface LocationMessage extends BaseMessage {
    type: "location";
    location: {
        latitude: number;
        longitude: number;
        name?: string;
        address?: string;
    };
}

export interface ContactsMessage extends BaseMessage {
    type: "contacts";
    contacts: unknown[]; // You can expand this if you need to parse shared contacts
}

export interface InteractiveMessage extends BaseMessage {
    type: "interactive";
    interactive: {
        type: "button_reply" | "list_reply";
        button_reply?: {
            id: string;
            title: string;
        };
        list_reply?: {
            id: string;
            title: string;
            description?: string;
        };
    };
}

export interface ButtonMessage extends BaseMessage {
    type: "button";
    button: {
        text: string;
        payload: string;
    };
}

export interface ReactionMessage extends BaseMessage {
    type: "reaction";
    reaction: {
        message_id: string;
        emoji: string;
    };
}

// Discriminator union properly exports all message possibilities
export type Message =
    | TextMessage
    | ImageMessage
    | VideoMessage
    | AudioMessage
    | DocumentMessage
    | StickerMessage
    | LocationMessage
    | ContactsMessage
    | InteractiveMessage
    | ButtonMessage
    | ReactionMessage;