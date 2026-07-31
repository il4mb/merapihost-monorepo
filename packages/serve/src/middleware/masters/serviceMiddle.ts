import { getConnection } from "@/utils/connection";
import { Service } from "@/utils/entities/service";
import { Exception } from "@/utils/exception";
import { Request, Response, NextFunction } from "express";

export const serviceWebsiteMiddleware = async (req: Request, res: Response, next: NextFunction) => {
    const id = req.params.id;
    if (!id || typeof id !== "string") {
        throw new Exception({
            status: 400,
            message: "Website ID is required",
            type: "BAD_REQUEST"
        });
    }
    const db = await getConnection();
    const repository = db.getRepository(Service);
    const service = await repository.findOne({ where: { id, type: "website" } });
    if (!service) {
        throw new Exception({
            status: 404,
            message: "Website not found",
            type: "NOT_FOUND"
        });
    }
    req.service = service;
    next();
}