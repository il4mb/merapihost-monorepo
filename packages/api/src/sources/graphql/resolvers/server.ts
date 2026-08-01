import { Arg, Args, Query, Resolver } from "type-graphql";
import { TypeServer } from "../types/server";
import { CreateServerInput } from "../inputs/server";

@Resolver()
export class ServerResolver {

    @Query(() => [TypeServer])
    async servers(): Promise<TypeServer[]> {
        // Fetch servers from the database or any other source
        // For demonstration, returning an empty array
        return [];
    }

    @Query(() => TypeServer, { nullable: true })
    async server(id: string): Promise<TypeServer | null> {
        // Fetch a single server by ID from the database or any other source
        // For demonstration, returning null
        return null;
    }


    @Query(() => TypeServer, { nullable: true })
    async create(@Args() { }: CreateServerInput): Promise<TypeServer> {
        // Logic to create a new server using the provided input
        // For demonstration, returning a mock server object
        const newServer: TypeServer = {
            id: "1",
            hostname: "example.com",
            description: "Example Server",
            masterKey: "masterKey123",
            isActive: true,
            metadata: { /* ... */ } as any, // Replace with actual metadata
            createdAt: new Date(),
            updatedAt: new Date(),
        };
        return newServer;
    }

}