import { ArgsType, Field } from "type-graphql";
import { Length } from "class-validator";

@ArgsType()
export class CreateServerInput {
    @Field()
    @Length(3, 64)
    hostname: string;

    @Field({ nullable: true })
    @Length(0, 255)
    description?: string;

    @Field()
    @Length(12, 64)
    masterKey: string;
}
