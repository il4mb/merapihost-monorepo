import { Column, Entity, Index, JoinColumn, ManyToOne, ObjectIdColumn } from "typeorm";
import { ObjectId } from "mongodb";
import { Service } from "./service";

@Entity("whatsapp_accounts")
export class WhatsappAccount {

    @ObjectIdColumn()
    _id: ObjectId;

    // @ManyToOne(() => Service, e => e._id, { onDelete: "CASCADE" })
    // @JoinColumn({ name: "service_id" })
    // service!: Service;

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