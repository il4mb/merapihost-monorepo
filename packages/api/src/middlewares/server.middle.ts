import { getConnection } from "@/sources/connection";
import { Server } from "@/sources/entities/server";
import { Exception } from "@/utils/exception";
import { Request, Response, NextFunction } from "express";

export const serverMiddleware = async (req: Request, res: Response, next: NextFunction) => {
    const serverId = req.params.id;
    if (!serverId || typeof serverId !== "string" || serverId.trim() === "") {
        throw new Exception({
            status: 400,
            message: "Server ID is required in the request parameters.",
            type: "BAD_REQUEST"
        });
    }

    const db = await getConnection();
    const repository = db.getRepository(Server);
    const server = await repository.findOne({ where: { id: serverId } });
    if (!server) {
        throw new Exception({
            status: 404,
            message: `Server with ID ${serverId} not found.`,
            type: "NOT_FOUND"
        });
    }

    req.server = server;
    next();
};