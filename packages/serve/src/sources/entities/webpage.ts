import { Column, CreateDateColumn, DeleteDateColumn, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
import { Service } from "./service";
import { type MetaTag } from "@/types/client";

@Entity("webpages")
@Index(["service", "route"], { unique: true })
export class Webpage {
    @PrimaryGeneratedColumn("uuid")
    id!: string;

    @ManyToOne(() => Service, {
        nullable: false,
        onDelete: "CASCADE",
    })
    @JoinColumn({ name: "service_id" })
    service!: Service;

    @Column({ type: "varchar", length: 255 })
    route!: string;

    @Column({ type: "varchar", length: 255 })
    title!: string;

    @Column({ type: "text" })
    description!: string;

    @Column({ type: "json" })
    meta: MetaTag[] = [];

    @CreateDateColumn({ name: "created_at" })
    createdAt!: Date;

    @UpdateDateColumn({ name: "updated_at" })
    updatedAt!: Date;

    @DeleteDateColumn({ name: "deleted_at", nullable: true })
    deletedAt: Date | null = null;
}