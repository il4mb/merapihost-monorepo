import { Request, Response } from "express";
import WebsiteModel from "@/sources/models/website";
import { createWebsiteSchema, updateWebsiteSchema } from "@/sources/schemas";
import { Exception } from "@/utils/exception";
import DomainModel from "@/sources/models/domain";
import ServerModel from "@/sources/models/server";
import { getUpdate } from "@/utils/tools";

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

    const session = req.local.session;
    const patch = createWebsiteSchema.parse(req.body);

    if (!session) {
        throw new Exception({
            status: 401,
            message: "Unauthorized",
            type: "UNAUTHORIZED"
        });
    }
    if (!session.user.isVerified) {
        throw new Exception({
            status: 403,
            message: "Cannot create website, user is not verified.",
            type: "USER_NOT_VERIFIED"
        });
    }

    const domain = await DomainModel.findOne({ name: patch.domain }).cache();
    if (!domain) {
        throw new Exception({
            status: 400,
            message: "Domain not found, please add it first.",
            type: "DOMAIN_NOT_FOUND"
        });
    }

    const server = await (async () => {
        if (patch.serverId) {
            const server = await ServerModel.findById(patch.serverId).cache();
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

    const existingWebsite = await WebsiteModel.findOne({
        domainId: domain._id,
        userId: session.user._id
    }).cache();

    if (existingWebsite) {
        throw new Exception({
            status: 400,
            message: "Website already exists for this domain.",
            type: "WEBSITE_EXISTS"
        });
    }

    const websiteDoc = await WebsiteModel.create({
        domainId: domain._id,
        serverId: server._id,
        name: patch.name,
        description: patch.description,
        userId: session.user._id,
        status: "inactive"
    });

    res.status(201).json({
        success: true,
        message: "Website created successfully.",
        data: websiteDoc
    });
}


export const getWebsite = async (req: Request, res: Response) => {
    const website = req.local.website;
    if (!website) {
        throw new Exception({
            status: 404,
            message: "Cannot retrieve website because it was not found.",
            type: "WEBSITE_NOT_FOUND"
        });
    }

    res.json({
        success: true,
        data: website
    });
}

export const updateWebsite = async (req: Request, res: Response) => {
    const session = req.local.session;
    const website = req.local?.website;

    if (!session) {
        throw new Exception({
            status: 401,
            message: "Unauthorized",
            type: "UNAUTHORIZED"
        });
    }
    if (!session.user.isVerified) {
        throw new Exception({
            status: 403,
            message: "Cannot update website, user is not verified.",
            type: "USER_NOT_VERIFIED"
        });
    }
    if (!website) {
        throw new Exception({
            status: 404,
            message: "Cannot update website because it was not found.",
            type: "WEBSITE_NOT_FOUND"
        });
    }

    const patch = updateWebsiteSchema.parse(req.body);
    const updatedCollector = {} as Record<string, any>;
    if (patch.domain) {
        const domain = await DomainModel.findOne({ name: patch.domain }).cache();
        if (!domain) {
            throw new Exception({
                status: 400,
                message: "Domain not found, please add it first.",
                type: "DOMAIN_NOT_FOUND"
            });
        }
        if (domain._id.toString() !== website.domainId.toString()) {
            updatedCollector.domainId = domain._id;
        }
    }

    if (patch.serverId) {
        const server = await ServerModel.findById(patch.serverId).cache();
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
        if (server._id.toString() !== website.serverId.toString()) {
            updatedCollector.serverId = server._id;
        }
    }

    if (patch.name) {
        updatedCollector.name = patch.name;
    }

    if (patch.description) {
        updatedCollector.description = patch.description;
    }

    const updated = getUpdate(updatedCollector, website);
    if (Object.keys(updated).length === 0) {
        res.json({
            success: true,
            message: "No changes detected, website remains unchanged.",
            data: website
        });
        return;
    }

    const updatedWebsite = await WebsiteModel.findByIdAndUpdate(website._id, { $set: updated }, { returnDocument: "after" });

    res.json({
        success: true,
        message: "Website updated successfully.",
        data: updatedWebsite
    });
}

export const deleteWebsite = async (req: Request, res: Response) => {
    const session = req.local.session;
    const website = req.local.website;
    if (!session) {
        throw new Exception({
            status: 401,
            message: "Unauthorized",
            type: "UNAUTHORIZED"
        });
    }
    if (!session.user.isVerified) {
        throw new Exception({
            status: 403,
            message: "Cannot delete website, user is not verified.",
            type: "USER_NOT_VERIFIED"
        });
    }
    if (!website) {
        throw new Exception({
            status: 404,
            message: "Cannot delete website because it was not found.",
            type: "WEBSITE_NOT_FOUND"
        });
    }
    await WebsiteModel.findByIdAndDelete(website._id);

    res.json({
        success: true,
        message: "Website deleted successfully."
    });
}