import { Column, CreateDateColumn, DeleteDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";

@Entity("services")
export class Service {

    @PrimaryGeneratedColumn("uuid")
    id: string;

    @Column({ type: "enum", enum: ["website", "email"], default: "website" })
    type: "website" | "email" = "website";

    @Column({ type: "varchar", length: 64 })
    name: string;

    @Column({ type: "varchar", length: 64 })
    domain: string;

    @Column({ type: "varchar", length: 64, nullable: true })
    bucket: string | null;

    @Column({ type: "varchar", length: 64, nullable: true })
    domainVerifyToken: string | null;

    @Column({ type: "boolean", default: true })
    isActive: boolean = true;

    @CreateDateColumn({ name: "created_at" })
    createdAt: Date;

    @UpdateDateColumn({ name: "updated_at" })
    updatedAt: Date;

    @DeleteDateColumn({ name: "deleted_at" })
    deletedAt: Date | null;
}