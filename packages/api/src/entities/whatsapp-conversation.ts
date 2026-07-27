import { Entity, PrimaryGeneratedColumn, ManyToOne, JoinColumn } from "typeorm";
import { WhatsappAccount } from "./whatsapp-account";
import { WhatsappContact } from "./whatsapp-contact";

@Entity("whatsapp_conversations")
export class WhatsappConversation {

    @PrimaryGeneratedColumn("uuid")
    id!: string;

    @ManyToOne(() => WhatsappAccount, a => a.id, { onDelete: "CASCADE" })
    @JoinColumn({ name: "account_id" })
    account!: WhatsappAccount;

    @ManyToOne(() => WhatsappContact, c => c.id, { onDelete: "CASCADE" })
    @JoinColumn({ name: "contact_id" })
    contact!: WhatsappContact;
}