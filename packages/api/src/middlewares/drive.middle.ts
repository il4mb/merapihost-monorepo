import DriveModel from "@/sources/models/drive";
import DriveNodeModel from "@/sources/models/drive-node";
import { Request, Response, NextFunction } from "express";
import { Types } from "mongoose";

export const driveMiddleware = async (req: Request, res: Response, next: NextFunction) => {

    const session = req.local.session;
    const id = req.params.id;
    if (!session || !session.user) {
        return res.status(401).json({
            success: false,
            message: "Unauthorized",
            type: "UNAUTHORIZED"
        });
    }
    if (!id || typeof id !== "string" || !Types.ObjectId.isValid(id)) {
        return res.status(400).json({
            success: false,
            message: "Invalid drive ID.",
            type: "INVALID_DRIVE_ID"
        });
    }

    const drive = await DriveModel.findOne({
        _id: new Types.ObjectId(id)
    }).cache();

    if (!drive) {
        return res.status(404).json({
            success: false,
            message: "Drive not found.",
            type: "DRIVE_NOT_FOUND"
        });
    }

    req.local.drive = drive;
    next();
}


export const driveNodeMiddleware = async (req: Request, res: Response, next: NextFunction) => {

    const session = req.local.session;
    const drive = req.local.drive;
    const nodeId = req.params.nodeId;

    if (!session || !session.user) {
        return res.status(401).json({
            success: false,
            message: "Unauthorized",
            type: "UNAUTHORIZED"
        });
    }
    if (!drive) {
        return res.status(404).json({
            success: false,
            message: "Drive not found.",
            type: "DRIVE_NOT_FOUND"
        });
    }
    if (!nodeId || typeof nodeId !== "string" || !Types.ObjectId.isValid(nodeId)) {
        return res.status(400).json({
            success: false,
            message: "Invalid node ID.",
            type: "INVALID_NODE_ID"
        });
    }

    const node = await DriveNodeModel.findOne({
        _id: new Types.ObjectId(nodeId),
        driveId: drive._id
    }).cache();

    if (!node) {
        return res.status(404).json({
            success: false,
            message: "Node not found in the specified drive.",
            type: "NODE_NOT_FOUND"
        });
    }

    req.local.driveNode = node;
    next();
}