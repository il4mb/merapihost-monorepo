import { getConnection } from "@/utils/connection";
import { Webpage } from "@/utils/entities/webpage";
import { Exception } from "@/utils/exception";
import { Request, Response, NextFunction } from "express";

export const webpageMiddleware = async (req: Request, res: Response, next: NextFunction) => {

    const id = req.params.id;
    const website = req.service;

    if (!website) {
        throw new Exception({
            status: 400,
            message: "Website is missing in request context",
            type: "BAD_REQUEST"
        });
    }

    if (!id || typeof id !== "string") {
        throw new Exception({
            status: 400,
            message: "Webpage ID is required",
            type: "BAD_REQUEST"
        });
    }

    const db = await getConnection();
    const repository = db.getRepository(Webpage);
    const webpage = await repository.findOne({
        where: {
            id,
            service: { id: website.id }
        }
    });
    if (!webpage) {
        throw new Exception({
            status: 404,
            message: "Webpage not found",
            type: "NOT_FOUND"
        });
    }
    req.webpage = webpage;
    next();
}