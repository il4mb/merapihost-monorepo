import { getConnection } from "@/sources/connection";
import { Service } from "@/sources/entities/service";
import { Exception } from "@/utils/exception";
import { Request, Response } from "express";
import { createWebsiteSchema, updateWebsiteSchema } from "@/sources/schemas/website";
import { randomUUIDv7 } from "bun";
import { getUpdate } from "@/utils/tools";

export const queryWebsite = async (req: Request, res: Response) => {
    const db = await getConnection();
    const repository = db.getRepository(Service);
    const websites = await repository.find({ where: { type: "website" } });
    res.status(200).json({
        success: true,
        data: websites
    });
}

export const createWebsite = async (req: Request, res: Response) => {
    const patch = createWebsiteSchema.parse(req.body);
    const db = await getConnection();
    const repository = db.getRepository(Service);

    const domainVerifyToken = randomUUIDv7().replace(/-/g, "");
    const website = repository.create({
        ...patch,
        type: "website",
        domainVerifyToken
    });
    await repository.save(website);
    res.status(201).json({
        success: true,
        data: website
    });
}

export const updateWebsite = async (req: Request, res: Response) => {
    const service = req.service!;
    const patch = updateWebsiteSchema.parse(req.body);
    const db = await getConnection();
    const repository = db.getRepository(Service);

    const updated = getUpdate(patch, service);
    if (Object.keys(updated).length === 0) {
        throw new Exception({
            status: 400,
            message: "No fields to update",
            type: "BAD_REQUEST"
        });
    }
    await repository.update(service.id, updated);
    const updatedWebsite = {
        ...service,
        ...updated,
        updatedAt: new Date()
    }
    res.status(200).json({
        success: true,
        data: updatedWebsite
    });
}

export const deleteWebsite = async (req: Request, res: Response) => {
    const service = req.service!;
    const db = await getConnection();
    const repository = db.getRepository(Service);
    await repository.softDelete(service.id);
    res.status(200).json({
        success: true,
        message: "Website deleted successfully"
    });
}

export const getWebsite = async (req: Request, res: Response) => {
    const service = req.service!;
    res.status(200).json({
        success: true,
        data: service
    });
}

export const regenerateDomainVerifyToken = async (req: Request, res: Response) => {
    const service = req.service!;
    const db = await getConnection();
    const repository = db.getRepository(Service);
    
    const websiteId = service.id.replace(/-.*$/g, "");

    const domainVerifyToken = websiteId + "-" + randomUUIDv7().replace(/-/g, "").slice(websiteId.length);
    await repository.update(service.id, { domainVerifyToken });
    res.status(200).json({
        success: true,
        data: {
            ...service,
            domainVerifyToken,
            updatedAt: new Date()
        }
    });
}