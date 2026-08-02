import { Request, Response } from "express";
import WebsiteModel from "@/sources/models/website";
import { createWebsiteSchema } from "@/sources/schemas/website";
import { Exception } from "@/utils/exception";
import DomainModel from "@/sources/models/domain";
import ServerModel from "@/sources/models/server";

const getServerWithLeastWebsites = async () => {
    // Finds active servers, sorts by count (ascending), and grabs the first one
    return await ServerModel.findOne({ isActive: true })
        .sort({ websiteCount: 1, createdAt: 1 })
        .lean();
};

export const listWebsites = async (req: Request, res: Response) => {
    const websites = await WebsiteModel.find();
    res.json({
        success: true,
        data: websites
    });
}

export const createWebsite = async (req: Request, res: Response) => {

    const user = req.user;
    const patch = createWebsiteSchema.parse(req.body);

    if (!user) {
        throw new Exception({
            status: 401,
            message: "Unauthorized",
            type: "UNAUTHORIZED"
        });
    }

    const domain = await DomainModel.findOne({ name: patch.domain });
    if (!domain) {
        throw new Exception({
            status: 400,
            message: "Domain not found, please add it first.",
            type: "DOMAIN_NOT_FOUND"
        });
    }

    const server = await (async () => {
        if (patch.serverId) {
            const server = await ServerModel.findById(patch.serverId);
            if (!server) {
                throw new Exception({
                    status: 400,
                    message: "Server not found",
                    type: "SERVER_NOT_FOUND"
                });
            }
            if (!server.isActive) {
                throw new Exception({
                    status: 400,
                    message: "Server is inactive",
                    type: "SERVER_INACTIVE"
                });
            }
            return server;
        } else {
            const leastLoadedServer = await getServerWithLeastWebsites();
            if (!leastLoadedServer) {
                throw new Exception({
                    status: 400,
                    message: "No active servers available",
                    type: "NO_ACTIVE_SERVERS"
                });
            }
            return leastLoadedServer;
        }
    })();
    
    if (!server) {
        throw new Exception({
            status: 400,
            message: "No available server found for the moment. Please try again later.",
            type: "SERVER_NOT_FOUND"
        });
    }

    const websiteDoc = await WebsiteModel.create({
        domainId: domain._id,
        serverId: server._id,
        name: patch.name,
        description: patch.description,
        userId: user.uid,
        status: "inactive"
    });

    res.status(201).json({
        success: true,
        message: "Website created successfully.",
        data: websiteDoc
    });
}

