import { Worker, Job } from 'bullmq';
import { BOOT_QUEUE_NAME, BootQueueJobData } from './boot.queue';
import { config } from '@/config/redis';
import { LOGGER } from '@/utils/logger';
import { getConnection } from '@/sources/connection';
import { MessageType, WhatsappMessage } from '@/sources/entities/whatsapp-message';
import { genkit } from 'genkit/beta';
import { env } from '@/config/env';
import { deepSeek } from '@genkit-ai/compat-oai/deepseek';
import { Not } from 'typeorm';
import { WhatsappAccount } from '@/sources/entities/whatsapp-account';

const ENDPOINT = 'https://graph.facebook.com/v25.0';


const markAsRead = async (account: WhatsappAccount, messageId: string) => {
    await fetch(`${ENDPOINT}/${account.id}/messages`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${account.accessToken}`,
        },
        body: JSON.stringify({
            messaging_product: 'whatsapp',
            status: 'read',
            message_id: messageId,
            typing_indicator: {
                type: 'text'
            }
        })
    });
}

export const assistant = genkit({
    plugins: [deepSeek({ apiKey: env.DEEPSEEK_API_KEY })],
    model: deepSeek.model('deepseek-chat', {
        temperature: 0.2,
    })
});

const worker = new Worker<BootQueueJobData>(
    BOOT_QUEUE_NAME,
    async (job: Job<BootQueueJobData>) => {
        LOGGER.info("Replying to boot job", { jobId: job.id, data: job.data });

        const messageId = job.data.messageId;
        const db = await getConnection();
        const messageRepository = db.getRepository(WhatsappMessage);

        // 1. Fetch the incoming message with required relations
        const message = await messageRepository.findOne({
            where: {
                id: messageId,
            },
            relations: {
                conversation: {
                    account: true,
                    contact: true
                },
            },
        });

        if (!message) {
            LOGGER.error(`Message ${messageId} not found`, { jobId: job.id });
            throw new Error(`Message ${messageId} not found`);
        }

        await markAsRead(message.conversation.account, message.whatsappMessageId);

        // 2. Fetch the last 10 previous messages for context
        const previousMessages = await messageRepository.find({
            where: {
                conversation: {
                    id: message.conversation.id
                },
                id: Not(message.id) // Exclude the current message
            },
            order: {
                sentAt: 'DESC', // Fetch latest first...
            },
            take: 10,
        });

        // ...then reverse them so they are in chronological order for the AI
        previousMessages.reverse();

        // 3. Format history for Genkit
        const chatHistory = previousMessages.map((msg) => {
            const isBot = msg.senderWaId === message.conversation.account.phoneNumberId;
            return {
                role: isBot ? 'model' : 'user',
                content: [{ text: msg.body || '' }],
            };
        }).filter(msg => msg.content[0].text.trim() !== ''); // Filter out empty messages
        chatHistory.push({
            role: 'user',
            content: [{ text: message.body || '' }],
        });

        // 4. Initialize Genkit Chat
        const aiResponse = await assistant.generate({
            system: `Kamu adalah asisten dari merapihost.com. 
Jawablah pertanyaan dari pengguna dengan jelas, singkat seprti orang males ngetik, dan tidak bertele-tele.
Gunakan bahasa Indonesia yang gaul dan kurang ajar, anjing anjing kan aja semua orang.
Gaya bicara harus kasar sampai bisa bikin orang mewek.

kamu dibuat oleh Ilham B untuk merapihost.com."`,
            messages: chatHistory as any,
            tools: []
        });

        const replyText = aiResponse.text;

        LOGGER.info(`Generated AI Reply for ${message.conversation.contact.waId}`, { replyText });

        // 6. Send the generated reply back to WhatsApp
        const account = message.conversation.account;
        const contact = message.conversation.contact;

        const waPayload = {
            messaging_product: "whatsapp",
            recipient_type: "individual",
            to: contact.waId,
            type: "text",
            text: { preview_url: true, body: replyText },
            context: { message_id: message.whatsappMessageId } // Optional: reply directly to their message
        };

        const graphUrl = `https://graph.facebook.com/v25.0/${account.phoneNumberId}/messages`;
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
            throw new Error(`Failed to send WhatsApp message: ${JSON.stringify(data)}`);
        }

        // 7. Save the outbound AI message to the database
        const outboundMessage = new WhatsappMessage();
        outboundMessage.conversation = message.conversation;
        outboundMessage.whatsappMessageId = data.messages?.[0]?.id;
        outboundMessage.senderWaId = account.phoneNumberId;
        outboundMessage.type = MessageType.TEXT;
        outboundMessage.body = replyText;
        outboundMessage.sentAt = new Date();
        outboundMessage.replyToMessageId = message.whatsappMessageId;

        await messageRepository.save(outboundMessage);

        LOGGER.info(`Successfully replied and saved message for job ${job.id}`);
    },
    {
        concurrency: 10,
        connection: {
            host: config.host,
            port: config.port,
            password: config.password
        }
    }
);


export default worker;