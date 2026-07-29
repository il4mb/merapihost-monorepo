import { Column, CreateDateColumn, DeleteDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";

export interface ServiceMetadata {
    wabaId?: string;
    whatsappAccessToken?: string;
}

@Entity("services")
export class Service {

    @PrimaryGeneratedColumn("uuid")
    id: string;

    @Column({ type: "char", length: 64 })
    uid: string;

    @Column({ type: "enum", enum: ["website", "email", "whatsapp"], default: "website" })
    type: "website" | "email" | "whatsapp" = "website";

    @Column({ type: "varchar", length: 64 })
    name: string;

    @Column({ type: "boolean", default: true })
    isActive: boolean = true;

    @Column({ type: "json", nullable: true })
    metadata: ServiceMetadata | null;

    @CreateDateColumn({ name: "created_at" })
    createdAt: Date;

    @UpdateDateColumn({ name: "updated_at" })
    updatedAt: Date;

    @DeleteDateColumn({ name: "deleted_at" })
    deletedAt: Date | null;
}