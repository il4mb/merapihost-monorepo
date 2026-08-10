import { Request, Response } from "express";
import WebpageModel from "@/sources/models/webpage";
import DriveModel from "@/sources/models/drive";
import BucketModel from "@/sources/models/bucket";
import { createWebpageSchema, updateWebpageSchema, WEBPAGE_FIELDS, webpageQuerySchema } from "@/sources/schemas";
import { Exception } from "@/utils/exception";
import { createS3Client } from "@/utils/s3-client";
import type { IWebsite } from "@/sources/models";
import type { Types } from "mongoose";
import { validateRoute } from "@/utils/route";
import { getUpdate } from "@/utils/tools";
import { redis } from "bun";
import { PlainDocument } from "@/types/global";

const REDIS_TTL = 60 * 60; // 1 hour in seconds
const REDIS_KEY_PREFIX = "webpage-nodes:";
const REDIS_META_KEY_PREFIX = "webpage-meta:";
const INITIAL_META_CONTENT = "<title>{{PAGE.TITLE}}</title>\n<meta name=\"description\" content=\"{{PAGE.DESCRIPTION}}\">\n\n<!-- Open Graph / Facebook -->\n<meta property=\"og:type\" content=\"website\">\n<meta property=\"og:title\" content=\"{{PAGE.TITLE}}\">\n<meta property=\"og:description\" content=\"{{PAGE.DESCRIPTION}}\">\n\n<!-- Twitter -->\n<meta property=\"twitter:card\" content=\"summary_large_image\">\n<meta property=\"twitter:title\" content=\"{{PAGE.TITLE}}\">\n<meta property=\"twitter:description\" content=\"{{PAGE.DESCRIPTION}}\">";

const getS3ClientForWebsite = async (website: IWebsite) => {
    if (!website.driveId) {
        throw new Exception({
            status: 400,
            message: "Website does not have a driveId.",
            type: "WEBSITE_NO_DRIVE_ID"
        });
    }
    const drive = await DriveModel.findById(website.driveId);
    if (!drive) {
        throw new Exception({
            status: 404,
            message: "Drive not found for the website.",
            type: "DRIVE_NOT_FOUND"
        });
    }
    const bucket = await BucketModel.findById(drive.bucketId);
    if (!bucket) {
        throw new Exception({
            status: 404,
            message: "Bucket not found for the drive.",
            type: "BUCKET_NOT_FOUND"
        });
    }

    return createS3Client({
        endpoint: bucket.endpoint,
        accessKey: bucket.accessKey,
        secretKey: bucket.secretKey,
        bucketName: bucket.name
    });
}

const getWebpageNodes = async (website: PlainDocument<IWebsite>, webpageId: Types.ObjectId) => {
    const redisKey = `${REDIS_KEY_PREFIX}${website._id}:${webpageId}`;
    const cachedNodes = await redis.get(redisKey);
    if (cachedNodes) {
        return JSON.parse(cachedNodes);
    }
    const s3Client = await getS3ClientForWebsite(website);
    const s3File = s3Client.file(`websites/${website._id}/${webpageId}/nodes.json`);
    const exists = await s3File.exists();
    const nodes = exists ? await s3File.json() : [];
    await redis.set(redisKey, JSON.stringify(nodes), "EX", REDIS_TTL);
    return nodes;
}

const setWebpageNodes = async (website: PlainDocument<IWebsite>, webpageId: Types.ObjectId, nodes: any[]) => {
    const s3Client = await getS3ClientForWebsite(website);
    const s3File = s3Client.file(`websites/${website._id}/${webpageId}/nodes.json`);
    await s3File.write(JSON.stringify(nodes), {
        type: "application/json"
    });
    const redisKey = `${REDIS_KEY_PREFIX}${website._id}:${webpageId}`;
    await redis.set(redisKey, JSON.stringify(nodes), "EX", REDIS_TTL);
}

const deleteWebpageNodes = async (website: PlainDocument<IWebsite>, webpageId: Types.ObjectId) => {
    const s3Client = await getS3ClientForWebsite(website);
    const s3File = s3Client.file(`websites/${website._id}/${webpageId}/nodes.json`);
    const exists = await s3File.exists();
    if (exists) {
        await s3File.delete();
    }
    const redisKey = `${REDIS_KEY_PREFIX}${website._id}:${webpageId}`;
    await redis.del(redisKey);
}

const getWebpageMeta = async (website: PlainDocument<IWebsite>, webpageId: Types.ObjectId) => {
    const redisKey = `${REDIS_META_KEY_PREFIX}${website._id}:${webpageId}`;
    const cachedMeta = await redis.get(redisKey);
    if (cachedMeta) {
        return cachedMeta;
    }
    const s3Client = await getS3ClientForWebsite(website);
    const s3File = s3Client.file(`websites/${website._id}/${webpageId}/meta.html`);
    const exists = await s3File.exists();
    if (!exists) {
        return "";
    }
    const meta = await s3File.text();
    await redis.set(redisKey, meta, "EX", REDIS_TTL);
    return meta;
}

const setWebpageMeta = async (website: PlainDocument<IWebsite>, webpageId: Types.ObjectId, meta: string) => {
    const s3Client = await getS3ClientForWebsite(website);
    const s3File = s3Client.file(`websites/${website._id}/${webpageId}/meta.html`);
    await s3File.write(meta, {
        type: "text/html"
    });
    const redisKey = `${REDIS_META_KEY_PREFIX}${website._id}:${webpageId}`;
    await redis.set(redisKey, meta, "EX", REDIS_TTL);
}

const deleteWebpageMeta = async (website: PlainDocument<IWebsite>, webpageId: Types.ObjectId) => {
    const s3Client = await getS3ClientForWebsite(website);
    const s3File = s3Client.file(`websites/${website._id}/${webpageId}/meta.html`);
    const exists = await s3File.exists();
    if (exists) {
        await s3File.delete();
    }
    const redisKey = `${REDIS_META_KEY_PREFIX}${website._id}:${webpageId}`;
    await redis.del(redisKey);
}


export const listWebpages = async (req: Request, res: Response) => {
    const website = req.local.website;
    if (!website) {
        throw new Exception({
            status: 404,
            message: "Website not found or you do not have permission to access it.",
            type: "WEBSITE_NOT_FOUND"
        });
    };
    const webpages = await WebpageModel.find({ website: website._id }).lean().cache();
    res.json({
        success: true,
        data: webpages.map(wp => ({
            id: wp._id,
            title: wp.title,
            description: wp.description,
            route: wp.route,
            status: wp.status,
            createdAt: wp.createdAt,
            updatedAt: wp.updatedAt
        }))
    });
}


export const createWebpage = async (req: Request, res: Response) => {
    const website = req.local.website;
    if (!website) {
        throw new Exception({
            status: 404,
            message: "Website not found or you do not have permission to access it.",
            type: "WEBSITE_NOT_FOUND"
        });
    }
    const { nodes, meta, ...patch } = createWebpageSchema.parse(req.body);

    const existingWebpages = await WebpageModel.find({ website: website._id }).lean().cache();
    const existingRoutes = existingWebpages.map(wp => wp.route);
    const validationResult = validateRoute(patch.route, existingRoutes);
    if (validationResult.conflict) {
        throw new Exception({
            status: 400,
            message: validationResult.message || "Route conflict detected.",
            type: "ROUTE_CONFLICT"
        });
    }

    const webpage = await WebpageModel.create({
        ...patch,
        website: website._id,
    });
    try {
        await setWebpageNodes(website, webpage._id, nodes);
        await setWebpageMeta(website, webpage._id, meta || INITIAL_META_CONTENT);
    } catch (error) {
        await WebpageModel.deleteOne({ _id: webpage._id }).exec();
        throw new Exception({
            status: 500,
            message: "Error occurred while creating webpage.",
            type: "WEBPAGE_CREATION_ERROR"
        });
    }

    res.status(201).json({
        success: true,
        data: {
            id: webpage._id,
            title: webpage.title,
            description: webpage.description,
            route: webpage.route,
            status: webpage.status,
            createdAt: webpage.createdAt,
            updatedAt: webpage.updatedAt
        }
    });
}


export const getWebpage = async (req: Request, res: Response) => {
    const webpage = req.local.webpage;
    const website = req.local.website;

    if (!website) {
        throw new Exception({
            status: 404,
            message: "Website not found or you do not have permission to access it.",
            type: "WEBSITE_NOT_FOUND"
        });
    }

    if (!webpage) {
        throw new Exception({
            status: 404,
            message: "Webpage not found or you do not have permission to access it.",
            type: "WEBPAGE_NOT_FOUND"
        });
    }

    const { fields = [...WEBPAGE_FIELDS] } = webpageQuerySchema.pick({ fields: true }).parse(req.query);
    const collector = {} as Record<string, any>;

    for (const field of fields) {
        // 1. Handle special overridden/computed fields first
        if (field === "id") {
            collector[field] = webpage._id;
        } else if (field === "meta") {
            const meta = await getWebpageMeta(website, webpage._id);
            collector[field] = meta;
        } else if (field === "nodes") {
            const nodes = await getWebpageNodes(website, webpage._id);
            collector[field] = nodes;
        }
        // 2. Fallback to standard database properties
        else if (field in webpage) {
            collector[field] = webpage[field as keyof typeof webpage];
        }
    }

    res.json({
        success: true,
        data: collector
    });
}


export const updateWebpage = async (req: Request, res: Response) => {
    const webpage = req.local.webpage;
    const website = req.local.website;

    if (!website) {
        throw new Exception({
            status: 404,
            message: "Website not found or you do not have permission to access it.",
            type: "WEBSITE_NOT_FOUND"
        });
    }
    if (!webpage) {
        throw new Exception({
            status: 404,
            message: "Webpage not found or you do not have permission to access it.",
            type: "WEBPAGE_NOT_FOUND"
        });
    }

    const { nodes, meta, ...patch } = updateWebpageSchema.parse(req.body);

    const updated = getUpdate(patch, webpage);
    const hasChanges = Object.keys(updated).length > 0 || (nodes && nodes.length > 0) || (meta && meta.trim() !== "");
    if (!hasChanges) {
        throw new Exception({
            status: 412,
            message: "No changes detected, webpage remains unchanged.",
            type: "NO_CHANGES_DETECTED"
        });
    }

    // Only validate route if it is being updated and is different from the current route
    if (updated.route && updated.route !== webpage.route) {
        const existingWebpages = await WebpageModel.find({
            website: website._id,
            _id: { $ne: webpage._id }
        }).lean().cache();
        const existingRoutes = existingWebpages.map(wp => wp.route);
        const validationResult = validateRoute(updated.route, existingRoutes);

        if (validationResult.conflict) {
            throw new Exception({
                status: 400,
                message: validationResult.message || "Route conflict detected.",
                type: "ROUTE_CONFLICT"
            });
        }
    }

    // Update MongoDB document
    const updatedWebpage = await WebpageModel.findByIdAndUpdate(
        webpage._id,
        { $set: updated },
        { returnDocument: 'after' }
    );

    if (!updatedWebpage) {
        throw new Exception({
            status: 500,
            message: "Failed to update webpage.",
            type: "WEBPAGE_UPDATE_ERROR"
        });
    }

    if (nodes) {
        // Update S3 file if new nodes are provided
        await setWebpageNodes(website, webpage._id, nodes);
    }

    if (meta && typeof meta === "string" && meta.trim() !== "") {
        await setWebpageMeta(website, webpage._id, meta);
    }

    res.json({
        success: true,
        data: {
            id: updatedWebpage._id,
            title: updatedWebpage.title,
            description: updatedWebpage.description,
            route: updatedWebpage.route,
            createdAt: updatedWebpage.createdAt,
            updatedAt: updatedWebpage.updatedAt,
            status: updatedWebpage.status
        }
    });
}


export const deleteWebpage = async (req: Request, res: Response) => {
    const webpage = req.local.webpage;
    const website = req.local.website;

    if (!website) {
        throw new Exception({
            status: 404,
            message: "Website not found or you do not have permission to access it.",
            type: "WEBSITE_NOT_FOUND"
        });
    }
    if (!webpage) {
        throw new Exception({
            status: 404,
            message: "Webpage not found or you do not have permission to access it.",
            type: "WEBPAGE_NOT_FOUND"
        });
    }

    // Delete nodes from S3 and Redis
    await deleteWebpageNodes(website, webpage._id);
    await deleteWebpageMeta(website, webpage._id);

    // Delete from MongoDB
    await WebpageModel.findByIdAndDelete(webpage._id);

    res.json({
        success: true,
        message: "Webpage deleted successfully."
    });
}