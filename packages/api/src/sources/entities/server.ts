import { Column, CreateDateColumn, DeleteDateColumn, Entity, ObjectIdColumn, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
import type { IServerMetadata } from "../models/server";
import { ObjectId } from "mongodb";

@Entity("servers")
export class Server {

    @ObjectIdColumn()
    _id: ObjectId;

    @Column({ type: "varchar", length: 64 })
    hostname: string;

    @Column({ type: "text", nullable: true })
    description: string | null;

    @Column({ type: "varchar", length: 64 })
    masterKey: string;

    @Column({ type: "boolean", default: true })
    isActive: boolean = true;

    @Column({ type: "json", nullable: true })
    metadata: IServerMetadata | null;

    @CreateDateColumn({ name: "created_at" })
    createdAt: Date;

    @UpdateDateColumn({ name: "updated_at" })
    updatedAt: Date;

    @DeleteDateColumn({ name: "deleted_at" })
    deletedAt: Date | null;
}