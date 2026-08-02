import ServerModel, { type IServerMetadata } from "@/sources/models/server";
import { createServerSchema, serverInfoData, updateServerSchema } from '@/sources/schemas/server';
import { Exception } from '@/utils/exception';
import { getUpdate } from '@/utils/tools';
import { Request, Response } from 'express';
import { ObjectId } from "mongodb";
import { api } from '@/utils/api';

/**
 * 
 * @param hostname the target server hostname
 * @param masterKey the server master key
 * @returns 
 */
const getServerInfo = async (hostname: string, masterKey: string): Promise<IServerMetadata> => {
    const infoPath = `http://${hostname}/__master/system/info`;
    try {
        const { data: response } = await api.get(infoPath, {
            headers: {
                "X-Master-Key": masterKey
            }
        });
        if (!response.success) {
            throw new Exception({
                status: 500,
                message: "Failed to fetch server metadata.",
                type: "METADATA_FETCH_FAILED"
            });
        }

        const parsedMetadata = serverInfoData.parse(response.data);

        return {
            name: parsedMetadata.name,
            timestamp: parsedMetadata.timestamp,
            system: {
                platform: parsedMetadata.system.platform,
                architecture: parsedMetadata.system.architecture
            },
            totalStorage: parsedMetadata.storage.totalStorage,
            totalMemory: parsedMetadata.memory.totalSystem,
            cpu: {
                cores: parsedMetadata.cpu.cores,
                model: parsedMetadata.cpu.model
            }
        };
    } catch (error: any) {
        throw new Exception({
            status: 400,
            message: `Failed to fetch server metadata from ${hostname}: ${error.message}`,
            type: "METADATA_FETCH_FAILED"
        });
    }
}

/**
 * 
 * @param hostname the target to check
 * @param id the id to excluded
 */
const checkExistingServer = async (hostname: string, id?: string) => {
    const [host, port] = hostname.split(":");

    const existingServer = await ServerModel.findOne({
        ...(id ? { _id: { $ne: new ObjectId(id) } } : {}),
        $or: [
            { hostname: { $eq: host } },
            { hostname: { $regex: `^${host}:`, $options: 'i' } }
        ]
    });

    if (existingServer) {
        // We already know the host matches because of our precise query above,
        // so we only need to check if the port is the same.
        const [, existPort] = existingServer.hostname.split(":");

        if (existPort === port) {
            throw new Exception({
                status: 409,
                message: `Server with hostname ${hostname} (exact same port) already exists.`,
                type: "CONFLICT"
            });
        }

        throw new Exception({
            status: 409,
            message: `Server with hostname ${hostname} already exists on a different port.`,
            type: "CONFLICT"
        });
    }
}


export const listServers = async (req: Request, res: Response) => {

    const servers = await ServerModel.find();
    res.json({
        success: true,
        data: servers
    });
}


export const createServer = async (req: Request, res: Response) => {
    const patch = createServerSchema.parse(req.body);


    // This finds exact matches ("domain.com") OR anchored matches ("domain.com:8080")
    // This strictly prevents "node1" from matching "supernode1" or "node10".
    await checkExistingServer(patch.hostname);
    const metadata = await getServerInfo(patch.hostname, patch.masterKey);

    const serverDoc = await ServerModel.create({
        hostname: patch.hostname,
        description: patch.description,
        masterKey: patch.masterKey,
        isActive: true,
        metadata: metadata
    });

    res.status(201).json({
        success: true,
        message: "Server created successfully.",
        data: serverDoc
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
    let metadata: IServerMetadata = server.metadata;
    // If the hostname is being updated, check for conflicts
    if (patch.hostname && patch.hostname !== server.hostname) {
        await checkExistingServer(patch.hostname, server._id.toString());
        // If the hostname is updated, fetch new metadata
        metadata = await getServerInfo(patch.hostname, patch.masterKey || server.masterKey);
    }

    const updated = getUpdate(patch, server);
    if (Object.keys(updated).length === 0) {
        throw new Exception({
            status: 400,
            message: "No valid fields provided for update.",
            type: "BAD_REQUEST"
        });
    }
    for (const key in updated) {
        if (Object.prototype.hasOwnProperty.call(updated, key)) {
            server[key] = updated[key];
        }
    }
    server.metadata = metadata;
    await server.save();

    res.json({
        success: true,
        data: { ...server, ...updated, metadata }
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

    await ServerModel.deleteOne({ _id: server._id });

    res.json({
        success: true,
        message: "Server deleted successfully."
    });
}