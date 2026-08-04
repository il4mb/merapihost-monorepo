import { driveCreateFolderSchema, driveQuerySchema, driveRenameSchema, driveMoveCopySchema } from "@/sources/schemas/drive";
import { isDescendant, copyRecursively } from "@/sources/tools/drive";
import DriveNodeModel from "@/sources/models/drive-node";
import { Exception } from "@/utils/exception";
import { Request, Response } from "express";
import { Types } from "mongoose";

// Helper to catch E11000 globally
const handleDuplicateError = (error: any) => {
    if (error.code === 11000 || (error.message && error.message.includes("duplicate key error"))) {
        throw new Exception({
            status: 400,
            message: "A file or folder with this name already exists in this location.",
            type: "DUPLICATE_NAME"
        });
    }
    throw error;
};

export const getListFilesAndFolders = async (req: Request, res: Response) => {
    const drive = req.local.drive;
    if (!drive) {
        throw new Exception({
            status: 404,
            message: "Drive not found.",
            type: "DRIVE_NOT_FOUND"
        });
    }

    const query = driveQuerySchema.parse(req.query);
    const filter: any = { driveId: drive._id };

    if (query.folderId) {
        filter.parentId = new Types.ObjectId(query.folderId);
    } else {
        filter.parentId = null; // Root level
    }

    const items = await DriveNodeModel.find(filter)
        .sort({ type: 1, name: 1 }) // Folders first, then files, both sorted by name
        .lean()
        .cache(); // Recommend adding .cache() here if you are using your caching plugin

    res.json({
        success: true,
        data: items.map(item => ({
            id: item._id,
            name: item.name,
            type: item.type,
            metadata: item.metadata || {},
            createdAt: item.createdAt,
            updatedAt: item.updatedAt
        }))
    });
}

export const createNodeFolder = async (req: Request, res: Response) => {
    try {
        const drive = req.local.drive;
        const session = req.local.session; // Removed trailing '!' as we check it below

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
                message: "Cannot create folder, user is not verified.",
                type: "USER_NOT_VERIFIED"
            });
        }
        if (!drive) {
            throw new Exception({
                status: 404,
                message: "Drive not found.",
                type: "DRIVE_NOT_FOUND"
            });
        }

        const body = driveCreateFolderSchema.parse(req.body);

        if (body.folderId) {
            // Verify parent folder exists and is actually a folder
            const parent = await DriveNodeModel.findOne({
                _id: body.folderId,
                driveId: drive._id,
                type: "folder"
            }).cache();

            if (!parent) {
                throw new Exception({
                    status: 404,
                    message: "Parent folder not found or is invalid.",
                    type: "INVALID_PARENT"
                });
            }
        }

        const newFolder = new DriveNodeModel({
            driveId: drive._id,
            name: body.name,
            type: "folder",
            parentId: body.folderId ? new Types.ObjectId(body.folderId) : null
        });

        await newFolder.save();

        res.status(201).json({
            success: true,
            message: "Folder created successfully.",
            data: {
                id: newFolder._id,
                name: newFolder.name,
                type: newFolder.type,
                metadata: newFolder.metadata || {},
                createdAt: newFolder.createdAt,
                updatedAt: newFolder.updatedAt
            }
        });
    } catch (error) {
        handleDuplicateError(error);
    }
};

export const getNodeById = async (req: Request, res: Response) => {
    const node = req.local.driveNode;
    if (!node) {
        throw new Exception({
            status: 404,
            message: "Node not found.",
            type: "NODE_NOT_FOUND"
        });
    }

    res.json({
        success: true,
        data: {
            id: node._id,
            name: node.name,
            type: node.type,
            metadata: node.metadata || {},
            createdAt: node.createdAt,
            updatedAt: node.updatedAt
        }
    });
};

export const deleteNode = async (req: Request, res: Response) => {
    const node = req.local.driveNode;
    if (!node) {
        throw new Exception({
            status: 404,
            message: "Node not found.",
            type: "NODE_NOT_FOUND"
        });
    }

    // This safely triggers the cascade delete hook we built earlier
    await DriveNodeModel.findByIdAndDelete(node._id);

    res.json({
        success: true,
        message: "Item deleted successfully."
    });
};

export const renameNode = async (req: Request, res: Response) => {
    try {
        const node = req.local.driveNode;
        if (!node) {
            throw new Exception({
                status: 404,
                message: "Node not found.",
                type: "NODE_NOT_FOUND"
            });
        }

        const { newName } = driveRenameSchema.parse(req.body);

        node.name = newName;
        await node.save(); // Will throw E11000 if name exists in the same folder

        res.json({
            success: true,
            message: "Item renamed successfully.",
            data: {
                id: node._id,
                name: node.name,
                type: node.type,
                metadata: node.metadata || {},
                createdAt: node.createdAt,
                updatedAt: node.updatedAt
            }
        });
    } catch (error) {
        handleDuplicateError(error);
    }
};

export const moveNode = async (req: Request, res: Response) => {
    try {
        const drive = req.local.drive;
        const node = req.local.driveNode;

        // FIX: Corrected OR logic to prevent undefined crashes
        if (!node || !drive) {
            throw new Exception({
                status: 404,
                message: "Drive or node not found.",
                type: "DRIVE_NOT_FOUND"
            });
        }

        const { newParentId } = driveMoveCopySchema.parse(req.body);

        if (newParentId) {
            // FIX: Explicitly check for moving into itself to provide a clear 400 error
            if (node._id.toString() === newParentId) {
                throw new Exception({
                    status: 400,
                    message: "Cannot move a folder into itself.",
                    type: "CYCLIC_MOVE"
                });
            }

            // 1. Validate new parent exists and is a folder
            const newParentDrive = await DriveNodeModel.findOne({
                _id: newParentId,
                driveId: drive._id,
                type: "folder"
            }).cache();

            if (!newParentDrive) {
                throw new Exception({
                    status: 404,
                    message: "Target folder not found.",
                    type: "NEW_PARENT_NOT_FOUND"
                });
            }

            // 2. Prevent cyclic moves (moving a folder into its own subfolder)
            const isInside = await isDescendant(node._id, new Types.ObjectId(newParentId));
            if (isInside) {
                throw new Exception({
                    status: 400,
                    message: "Cannot move a folder into its own subfolder.",
                    type: "CYCLIC_MOVE"
                });
            }

            node.parentId = newParentDrive._id;
        } else {
            node.parentId = null; // Move to root
        }

        await node.save();

        res.json({
            success: true,
            message: "Item moved successfully.",
            data: {
                id: node._id,
                name: node.name,
                type: node.type,
                metadata: node.metadata || {},
                createdAt: node.createdAt,
                updatedAt: node.updatedAt
            }
        });
    } catch (error) {
        handleDuplicateError(error);
    }
};

export const copyNode = async (req: Request, res: Response) => {
    try {
        const drive = req.local.drive;
        const nodeToCopy = req.local.driveNode;

        if (!drive || !nodeToCopy) {
            throw new Exception({
                status: 404,
                message: "Drive or item to copy not found.",
                type: "DRIVE_NOT_FOUND"
            });
        }

        const { newParentId } = driveMoveCopySchema.parse(req.body);

        if (newParentId) {
            const newParentDrive = await DriveNodeModel.findOne({
                _id: newParentId,
                driveId: drive._id,
                type: "folder"
            }).cache();

            if (!newParentDrive) {
                throw new Exception({
                    status: 404,
                    message: "Target folder not found.",
                    type: "NEW_PARENT_NOT_FOUND"
                });
            }
        }

        const copiedDrive = await copyRecursively(
            nodeToCopy._id,
            newParentId ? new Types.ObjectId(newParentId) : null,
            drive._id
        );

        res.status(201).json({
            success: true,
            message: "Item copied successfully.",
            data: {
                id: copiedDrive._id,
                name: copiedDrive.name,
                type: copiedDrive.type,
                metadata: copiedDrive.metadata || {},
                createdAt: copiedDrive.createdAt,
                updatedAt: copiedDrive.updatedAt
            }
        });
    } catch (error) {
        handleDuplicateError(error);
    }
};