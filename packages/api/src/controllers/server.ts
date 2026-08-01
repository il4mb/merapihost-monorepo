import { getConnection } from '@/sources/connection';
import { Server } from '@/sources/entities/server';
import { createServerSchema, updateServerSchema } from '@/sources/schemas/server';
import { api } from '@/utils/api';
import { Exception } from '@/utils/exception';
import { getUpdate } from '@/utils/tools';
import { Request, Response } from 'express';
import { Like, Not } from 'typeorm';

export const listServers = async (req: Request, res: Response) => {
    const db = await getConnection();
    const repository = db.getRepository(Server);
    const servers = await repository.find();
    res.json({
        success: true,
        data: servers
    });
}

export const createServer = async (req: Request, res: Response) => {
    const patch = createServerSchema.parse(req.body);
    const db = await getConnection();
    const repository = db.getRepository(Server);

    // 1. Extract the host and port BEFORE querying
    const [newHost, newPort] = patch.hostname.split(":");

    // 2. Query precisely using TypeORM's OR array syntax.
    // This finds exact matches ("domain.com") OR anchored matches ("domain.com:8080")
    // This strictly prevents "node1" from matching "supernode1" or "node10".
    const existingServer = await repository.findOne({
        where: [
            { hostname: newHost },
            { hostname: Like(`${newHost}:%`) }
        ]
    });

    if (existingServer) {
        // We already know the host matches because of our precise query above,
        // so we only need to check if the port is the same.
        const [, existPort] = existingServer.hostname.split(":");

        if (existPort === newPort) {
            throw new Exception({
                status: 409,
                message: `Server with hostname ${patch.hostname} (exact same port) already exists.`,
                type: "CONFLICT"
            });
        }

        throw new Exception({
            status: 409,
            message: `Server with hostname ${newHost} already exists on a different port.`,
            type: "CONFLICT"
        });
    }

    const infoPath = `http://${patch.hostname}/__master/server/info`;

    const { data: response } = await api.get(infoPath, {
        headers: {
            "X-Master-Key": patch.masterKey
        }
    });

    console.log("Server info response:", response);


    // const server = repository.create(patch);
    // await repository.save(server);

    res.status(201).json({
        success: true,
        message: "Server created successfully.",
        // data: server
    });
}

export const getServer = async (req: Request, res: Response) => {
    const server = req.server;
    if (!server) {
        throw new Exception({
            status: 404,
            message: "Server not found.",
            type: "NOT_FOUND"
        });
    }

    res.json({
        success: true,
        data: server
    });
}

export const updateServer = async (req: Request, res: Response) => {
    const server = req.server;
    if (!server) {
        throw new Exception({
            status: 404,
            message: "Server not found.",
            type: "NOT_FOUND"
        });
    }

    const patch = updateServerSchema.parse(req.body);
    const db = await getConnection();
    const repository = db.getRepository(Server);

    // If the hostname is being updated, check for conflicts
    if (patch.hostname && patch.hostname !== server.hostname) {
        const [newHost, newPort] = patch.hostname.split(":");

        const existingServer = await repository.findOne({
            where: [
                { id: Not(server.id), hostname: newHost },
                { id: Not(server.id), hostname: Like(`${newHost}:%`) }
            ]
        });

        if (existingServer) {
            const [, existPort] = existingServer.hostname.split(":");

            if (existPort === newPort) {
                throw new Exception({
                    status: 409,
                    message: `Server with hostname ${patch.hostname} (exact same port) already exists.`,
                    type: "CONFLICT"
                });
            }

            throw new Exception({
                status: 409,
                message: `Server with hostname ${newHost} already exists on a different port.`,
                type: "CONFLICT"
            });
        }
    }

    const updated = getUpdate(patch, server);
    if (Object.keys(updated).length === 0) {
        throw new Exception({
            status: 400,
            message: "No valid fields provided for update.",
            type: "BAD_REQUEST"
        });
    }

    await repository.update(server.id, updated);

    res.json({
        success: true,
        data: { ...server, ...updated }
    });
}

export const deleteServer = async (req: Request, res: Response) => {
    const server = req.server;
    if (!server) {
        throw new Exception({
            status: 404,
            message: "Server not found.",
            type: "NOT_FOUND"
        });
    }

    const db = await getConnection();
    const repository = db.getRepository(Server);
    await repository.softDelete(server.id);

    res.json({
        success: true,
        message: "Server deleted successfully."
    });
}