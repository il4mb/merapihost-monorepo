import { Column, CreateDateColumn, DeleteDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";

export interface ServerMetadata {
    name: string;
    timestamp: string;
    system: {
        platform: string;
        architecture: string;
    };
    totalStorage: number;
    totalMemory: number;
    cpu: {
        cores: number;
        model: string;
    };
}

@Entity("servers")
export class Server {

    @PrimaryGeneratedColumn("uuid")
    id: string;

    @Column({ type: "varchar", length: 64 })
    hostname: string;

    @Column({ type: "text", nullable: true })
    description: string | null;

    @Column({ type: "varchar", length: 64 })
    masterKey: string;

    @Column({ type: "boolean", default: true })
    isActive: boolean = true;

    @Column({ type: "json", nullable: true })
    metadata: ServerMetadata | null;

    @CreateDateColumn({ name: "created_at" })
    createdAt: Date;

    @UpdateDateColumn({ name: "updated_at" })
    updatedAt: Date;

    @DeleteDateColumn({ name: "deleted_at" })
    deletedAt: Date | null;
}