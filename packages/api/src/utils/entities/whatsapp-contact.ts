import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { WhatsappAccount } from "./whatsapp-account";

@Entity("whatsapp_contacts")
export class WhatsappContact {

    @PrimaryGeneratedColumn("uuid")
    id!: string;

    @ManyToOne(() => WhatsappAccount, e => e.id, { onDelete: "CASCADE" })
    @JoinColumn({ name: "account_id" })
    account!: WhatsappAccount;

    @Column({ name: "wa_id", length: 32 })
    waId!: string;

    @Column({ name: "user_id", nullable: true })
    userId?: string;

    @Column({ nullable: true })
    name!: string | null;
}