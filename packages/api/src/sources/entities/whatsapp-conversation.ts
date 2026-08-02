import { Entity, ManyToOne, JoinColumn, ObjectIdColumn } from "typeorm";
import { WhatsappAccount } from "./whatsapp-account";
import { WhatsappContact } from "./whatsapp-contact";
import { ObjectId } from "mongodb";

@Entity("whatsapp_conversations")
export class WhatsappConversation {

    @ObjectIdColumn()
    _id: ObjectId;

    // @ManyToOne(() => WhatsappAccount, a => a._id, { onDelete: "CASCADE" })
    // @JoinColumn({ name: "account_id" })
    // account!: WhatsappAccount;

    // @ManyToOne(() => WhatsappContact, c => c._id, { onDelete: "CASCADE" })
    // @JoinColumn({ name: "contact_id" })
    // contact!: WhatsappContact;
}