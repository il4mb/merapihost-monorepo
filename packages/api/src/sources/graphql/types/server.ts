
import type { IServerMetadata } from "@/sources/models/server";
import { ID, Field, ObjectType } from "type-graphql";

@ObjectType()
export class TypeServer {

    @Field(() => ID)
    readonly id: string;

    @Field()
    hostname: string;

    @Field({ nullable: true })
    description: string | null;

    @Field()
    masterKey: string;

    @Field()
    isActive: boolean;

    @Field()
    metadata: IServerMetadata;

    @Field(() => Date)
    createdAt: Date;

    @Field(() => Date)
    updatedAt: Date;
}