import { getConnection } from "@/utils/connection";
import { Service } from "@/utils/entities/service";
import { Exception } from "@/utils/exception";
import { Request, Response } from "express";
import { createWebsiteSchema, paramWebsiteSchema, updateWebsiteSchema } from "@/utils/schemas/website";
import { randomUUIDv7 } from "bun";
import { getUpdate } from "@/utils/tools";
import { Webpage } from "@/utils/entities/webpage";

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
    const patch = createWebsiteSchema.parse(req.body);
    const db = await getConnection();
    const repository = db.getRepository(Webpage);

    throw new Exception({
        status: 501,
        message: "Not implemented",
        type: "NOT_IMPLEMENTED"
    });
}

export const updateWebpage = async (req: Request, res: Response) => {
    const service = req.service!;
    const { id } = paramWebsiteSchema.parse(req.params);
    const patch = updateWebsiteSchema.parse(req.body);
    const db = await getConnection();
    const repository = db.getRepository(Webpage);
    const webpage = await repository.findOne({
        where: {
            id,
            service: { id: service.id }
        }
    });
    if (!webpage) {
        throw new Exception({
            status: 404,
            message: "Webpage not found",
            type: "NOT_FOUND"
        });
    }
    throw new Exception({
        status: 501,
        message: "Not implemented",
        type: "NOT_IMPLEMENTED"
    });
}

export const deleteWebpage = async (req: Request, res: Response) => {
    const service = req.service!;
    const { id } = paramWebsiteSchema.parse(req.params);
    const db = await getConnection();
    const repository = db.getRepository(Webpage);
    const website = await repository.findOne({
        where: {
            id,
            service: { id: service.id }
        }
    });
    if (!website) {
        throw new Exception({
            status: 404,
            message: "Webpage not found",
            type: "NOT_FOUND"
        });
    }
    await repository.softDelete(id);
    res.status(200).json({
        success: true,
        message: "Webpage deleted successfully"
    });
}

export const getWebpage = async (req: Request, res: Response) => {
    const service = req.service!;
    const { id } = paramWebsiteSchema.parse(req.params);
    const db = await getConnection();
    const repository = db.getRepository(Webpage);
    const webpage = await repository.findOne({
        where: {
            id,
            service: { id: service.id }
        }
    });

    if (!webpage) {
        throw new Exception({
            status: 404,
            message: "Webpage not found",
            type: "NOT_FOUND"
        });
    }
    res.status(200).json({
        success: true,
        data: webpage
    });
}