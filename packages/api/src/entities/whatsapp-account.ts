import { Column, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { Service } from "./service";

@Entity("whatsapp_accounts")
@Index(["service", "phoneNumberId"], { unique: true })
export class WhatsappAccount {
    @PrimaryGeneratedColumn("uuid")
    id!: string;

    @ManyToOne(() => Service, e => e.id, { onDelete: "CASCADE" })
    @JoinColumn({ name: "service_id" })
    service!: Service;

    @Column({ name: "phone_number_id", unique: true })
    phoneNumberId!: string;

    @Column({ name: "phone_number", length: 32 })
    phoneNumber!: string;

    @Column({ name: "display_name", length: 64, nullable: true })
    displayName?: string | null;

    @Column({ name: "status", length: 32, nullable: true })
    status?: string | null;

    @Column({ name: "access_token", type: "text", nullable: true })
    accessToken?: string | null;
}