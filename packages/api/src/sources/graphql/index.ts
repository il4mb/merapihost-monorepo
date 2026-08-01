import { buildSchema } from "type-graphql";
import { ServerResolver } from "./resolvers/server";
import { createHandler } from 'graphql-http/lib/use/express';

const schema = await buildSchema({
    resolvers: [ServerResolver],
    emitSchemaFile: true, // This will generate a schema.graphql file in the root directory
});

export const graphqlHandler = createHandler({
    schema,
    context: (req) => {
        return {};
    }
});