import { getConnection } from "@/utils/connection";
import { Exception } from "@/utils/exception";
import { Request, Response } from "express";
import { getUpdate } from "@/utils/tools";
import { Webpage } from "@/utils/entities/webpage";
import { createWebpageSchema, updateWebpageSchema } from "@/utils/schemas/webpage";
import { validateRoute } from "@/utils/route";
import { Not } from "typeorm";
import { s3Client } from "@/utils/s3-client";

export const queryWebpage = async (req: Request, res: Response) => {
    const service = req.service!;
    const db = await getConnection();
    const repository = db.getRepository(Webpage);
    const webpages = await repository.find({
        where: {
            service: { id: service.id }
        }
    });
    res.status(200).json({
        success: true,
        data: webpages
    });
}

export const createWebpage = async (req: Request, res: Response) => {
    const service = req.service!;
    if (!service || service.type !== "website") {
        throw new Exception({
            status: 400,
            message: "Website is missing in request context",
            type: "BAD_REQUEST"
        });
    }
    if (!service.bucket) {
        throw new Exception({
            status: 400,
            message: "Website bucket is missing in request context",
            type: "BAD_REQUEST"
        });
    }
    const patch = createWebpageSchema.parse(req.body);
    const db = await getConnection();
    const repository = db.getRepository(Webpage);
    const existingWebpages = await repository.find({
        where: {
            service: { id: service.id }
        }
    });
    const existingRoute = existingWebpages.map(wp => wp.route);
    const isRouteExists = validateRoute(patch.route, existingRoute);

    if (isRouteExists.conflict) {
        throw new Exception({
            status: 400,
            message: isRouteExists.message || "Route conflict",
            type: "BAD_REQUEST"
        });
    }

    const webpage = repository.create({
        ...patch,
        service: {
            id: service.id
        }
    });
    await repository.save(webpage);

    const content = JSON.stringify(patch.nodes);
    const s3File = s3Client.file(`/websites/${service.id}/webpages/${webpage.id}/nodes.json`);
    await s3File.write(content, {
        acl: "public-read",
        type: "application/json",
        bucket: service.bucket
    });
    await Bun.redis.set(`webpage:${webpage.id}`, content);
    await Bun.redis.expire(`webpage:${webpage.id}`, 60 * 60 * 24 * 7); // Set TTL for 7 days

    res.status(201).json({
        success: true,
        data: webpage
    });
}

export const updateWebpage = async (req: Request, res: Response) => {
    const service = req.service!;
    const webpage = req.webpage;

    if (!service || service.type !== "website") {
        throw new Exception({
            status: 400,
            message: "Website is missing in request context",
            type: "BAD_REQUEST"
        });
    }
    if (!webpage) {
        throw new Exception({
            status: 404,
            message: "Webpage not found",
            type: "NOT_FOUND"
        });
    }

    const patch = updateWebpageSchema.parse(req.body);
    const db = await getConnection();
    const repository = db.getRepository(Webpage);
    const existingWebpages = await repository.find({
        where: {
            service: { id: service.id },
            id: Not(webpage.id)
        }
    });
    const existingRoute = existingWebpages.map(wp => wp.route);
    if (patch.route) {
        const isRouteExists = validateRoute(patch.route, existingRoute);
        if (isRouteExists.conflict) {
            throw new Exception({
                status: 400,
                message: isRouteExists.message || "Route conflict",
                type: "BAD_REQUEST"
            });
        }
    }

    const updated = getUpdate(patch, webpage);
    if (Object.keys(updated).length === 0) {
        throw new Exception({
            status: 400,
            message: "No fields to update",
            type: "BAD_REQUEST"
        });
    }
    await repository.update(webpage.id, updated);

    if (patch.nodes) {
        const content = JSON.stringify(patch.nodes);
        const s3File = s3Client.file(`/websites/${service.id}/webpages/${webpage.id}/nodes.json`);
        await s3File.write(content, {
            acl: "public-read",
            type: "application/json",
            bucket: service.bucket
        });
        await Bun.redis.set(`webpage:${webpage.id}`, content);
        await Bun.redis.expire(`webpage:${webpage.id}`, 60 * 60 * 24 * 7); // Set TTL for 7 days
    }

    const updatedWebpage = {
        ...webpage,
        ...updated,
        updatedAt: new Date()
    }
    res.status(200).json({
        success: true,
        data: updatedWebpage
    });
}

export const deleteWebpage = async (req: Request, res: Response) => {
    const service = req.service!;
    if (!service || service.type !== "website") {
        throw new Exception({
            status: 400,
            message: "Website is missing in request context",
            type: "BAD_REQUEST"
        });
    }
    if (!service.bucket) {
        throw new Exception({
            status: 400,
            message: "Website bucket is missing in request context",
            type: "BAD_REQUEST"
        });
    }
    const webpage = req.webpage;
    if (!webpage) {
        throw new Exception({
            status: 404,
            message: "Webpage not found",
            type: "NOT_FOUND"
        });
    }
    const db = await getConnection();
    const repository = db.getRepository(Webpage);
    await repository.softDelete(webpage.id);
    const s3File = s3Client.file(`/websites/${service.id}/webpages/${webpage.id}/nodes.json`);
    await s3File.delete();
    await Bun.redis.del(`webpage:${webpage.id}`);

    res.status(200).json({
        success: true,
        message: "Webpage deleted successfully"
    });
}

export const getWebpage = async (req: Request, res: Response) => {
    const service = req.service!;
    if (!service || service.type !== "website") {
        throw new Exception({
            status: 400,
            message: "Website is missing in request context",
            type: "BAD_REQUEST"
        });
    }
    if (!service.bucket) {
        throw new Exception({
            status: 400,
            message: "Website bucket is missing in request context",
            type: "BAD_REQUEST"
        });
    }
    const webpage = req.webpage;
    if (!webpage) {
        throw new Exception({
            status: 404,
            message: "Webpage not found",
            type: "NOT_FOUND"
        });
    }

    const cachedContent = await Bun.redis.get(`webpage:${webpage.id}`);
    if (cachedContent) {
        return res.status(200).json({
            success: true,
            data: {
                ...webpage,
                nodes: JSON.parse(cachedContent)
            }
        });
    }

    const s3File = s3Client.file(`/websites/${service.id}/webpages/${webpage.id}/nodes.json`);
    const exists = await s3File.exists();
    let nodes = [];
    if (exists) {
        nodes = await s3File.json();
    }

    await Bun.redis.set(`webpage:${webpage.id}`, JSON.stringify(nodes));
    await Bun.redis.expire(`webpage:${webpage.id}`, 60 * 60 * 24 * 7); // Set TTL for 7 days

    return res.status(200).json({
        success: true,
        data: {
            ...webpage,
            nodes
        }
    });

}