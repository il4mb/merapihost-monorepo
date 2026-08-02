
import type { IServerMetadata } from "@/sources/models/server";
import { ID, Field, ObjectType } from "type-graphql";
import GraphQLJSON from "graphql-type-json";

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

    @Field(() => GraphQLJSON, { nullable: true })
    metadata: IServerMetadata | null;

    @Field(() => Date)
    createdAt: Date;

    @Field(() => Date)
    updatedAt: Date;
}