import { Column, Entity, JoinColumn, ManyToOne, ObjectIdColumn, PrimaryGeneratedColumn } from "typeorm";
import { WhatsappAccount } from "./whatsapp-account";
import { ObjectId } from "mongodb";

@Entity("whatsapp_contacts")
export class WhatsappContact {

    @ObjectIdColumn()
    _id: ObjectId;

    // @ManyToOne(() => WhatsappAccount, e => e._id, { onDelete: "CASCADE" })
    // @JoinColumn({ name: "account_id" })
    // account!: WhatsappAccount;

    @Column({ name: "wa_id", length: 32 })
    waId!: string;

    @Column({ name: "user_id", nullable: true })
    userId?: string;

    @Column({ nullable: true })
    name!: string | null;
}