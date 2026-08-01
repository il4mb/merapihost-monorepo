import { Field, ID, ObjectType } from "type-graphql";
import { Column, CreateDateColumn, DeleteDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";

@ObjectType()
@Entity("servers")
export class Server {

    @PrimaryGeneratedColumn("uuid")
    @Field(() => ID)
    id: string;

    @Column({ type: "varchar", length: 64 })
    @Field()
    name: string;

    @Column({ type: "varchar", length: 64 })
    @Field()
    hostname: string;

    @Column({ type: "boolean", default: true })
    @Field()
    isActive: boolean = true;

    @CreateDateColumn({ name: "created_at" })
    @Field()
    createdAt: Date;

    @UpdateDateColumn({ name: "updated_at" })
    @Field()
    updatedAt: Date;

    @DeleteDateColumn({ name: "deleted_at" })
    @Field({ nullable: true })
    deletedAt: Date | null;
}