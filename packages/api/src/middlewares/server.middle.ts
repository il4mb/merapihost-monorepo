import ServerModel from "@/sources/models/server";
import { Exception } from "@/utils/exception";
import { Request, Response, NextFunction } from "express";
import { ObjectId } from "mongodb";

export const serverMiddleware = async (req: Request, res: Response, next: NextFunction) => {
    const serverId = req.params.id;
    if (!serverId || typeof serverId !== "string" || serverId.trim() === "") {
        throw new Exception({
            status: 400,
            message: "Server ID is required in the request parameters.",
            type: "BAD_REQUEST"
        });
    }

    const server = await ServerModel.findById(new ObjectId(serverId));
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