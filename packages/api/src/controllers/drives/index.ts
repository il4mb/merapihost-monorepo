import { Request, Response } from "express";
import DriveModel, { IDrive } from "@/sources/models/drive";
import { Exception } from "@/utils/exception";
import {
    driveCreateFolderSchema,
    driveQuerySchema,
    driveRenameSchema,
    driveMoveCopySchema
} from "@/sources/schemas/drive";
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

export const listDrives = async (req: Request, res: Response) => {
    const session = req.local.session;
    if (!session) {
        throw new Exception({ status: 401, message: "Unauthorized", type: "UNAUTHORIZED" });
    }

    const query = driveQuerySchema.parse(req.query);

    // .lean() is used for massive performance gains on read-only lists
    const drives = await DriveModel.find({
        userId: session.user._id,
        parentId: query.folderId ? new Types.ObjectId(query.folderId) : null
    }).lean().cache();

    res.json({
        success: true,
        data: drives
    });
};

export const createDriveFolder = async (req: Request, res: Response) => {
    try {
        const session = req.local.session!;
        const body = driveCreateFolderSchema.parse(req.body);

        if (body.folderId) {
            // Verify parent folder exists and is actually a folder
            const parent = await DriveModel.findOne({ _id: body.folderId, userId: session.user._id }).cache();
            if (!parent || parent.type !== "folder") {
                throw new Exception({ status: 404, message: "Parent folder not found or is invalid.", type: "INVALID_PARENT" });
            }
        }

        const newFolder = new DriveModel({
            userId: session.user._id,
            name: body.name,
            type: "folder",
            parentId: body.folderId ? new Types.ObjectId(body.folderId) : null
        });

        await newFolder.save();

        res.status(201).json({
            success: true,
            message: "Folder created successfully.",
            data: newFolder
        });
    } catch (error) {
        handleDuplicateError(error);
    }
};

export const getDriveById = async (req: Request, res: Response) => {
    const drive = req.local.drive; // Assuming this is populated by a middleware
    if (!drive) {
        throw new Exception({ status: 404, message: "Drive not found.", type: "DRIVE_NOT_FOUND" });
    }

    res.json({
        success: true,
        data: drive.toJSON() // Convert Mongoose document to plain object
    });
};

export const deleteDrive = async (req: Request, res: Response) => {
    const drive = req.local.drive;
    if (!drive) {
        throw new Exception({ status: 404, message: "Drive not found.", type: "DRIVE_NOT_FOUND" });
    }

    // This safely triggers the cascade delete hook we built earlier
    await DriveModel.findByIdAndDelete(drive._id);

    res.json({
        success: true,
        message: "Item deleted successfully."
    });
};

export const renameDrive = async (req: Request, res: Response) => {
    try {
        const session = req.local.session!;
        const { driveId } = req.params;
        const { newName } = driveRenameSchema.parse(req.body);

        const drive = await DriveModel.findOne({ _id: driveId, userId: session.user._id });
        if (!drive) {
            throw new Exception({ status: 404, message: "Drive not found.", type: "DRIVE_NOT_FOUND" });
        }

        drive.name = newName;
        await drive.save(); // Will throw E11000 if name exists in the same folder

        res.json({
            success: true,
            message: "Item renamed successfully.",
            data: drive.toJSON() // Convert Mongoose document to plain object
        });
    } catch (error) {
        handleDuplicateError(error);
    }
};

export const moveDrive = async (req: Request, res: Response) => {
    try {
        const session = req.local.session!;
        const drive = req.local.drive;
        const { newParentId } = driveMoveCopySchema.parse(req.body);

        if (!drive) {
            throw new Exception({ status: 404, message: "Drive not found.", type: "DRIVE_NOT_FOUND" });
        }

        if (newParentId) {
            // 1. Check if moving into itself
            if (drive._id.toString() === newParentId) {
                throw new Exception({ status: 400, message: "Cannot move a folder into itself.", type: "CYCLIC_MOVE" });
            }

            // 2. Validate new parent exists and is a folder
            const newParentDrive = await DriveModel.findOne({ _id: newParentId, userId: session.user._id, type: "folder" }).cache();
            if (!newParentDrive) {
                throw new Exception({ status: 404, message: "Target folder not found.", type: "NEW_PARENT_NOT_FOUND" });
            }

            // 3. Prevent moving a folder into its own descendants (Cyclic Move Check)
            if (drive.type === "folder") {
                let currentAncestor: IDrive | null = newParentDrive;
                while (currentAncestor && currentAncestor.parentId) {
                    if (currentAncestor.parentId.toString() === drive._id.toString()) {
                        throw new Exception({ status: 400, message: "Cannot move a folder into its own subfolder.", type: "CYCLIC_MOVE" });
                    }
                    // Fetch the next ancestor up the chain
                    currentAncestor = await DriveModel.findById(currentAncestor.parentId).lean();
                }
            }

            drive.parentId = new Types.ObjectId(newParentId);
        } else {
            drive.parentId = null; // Move to root
        }

        await drive.save();

        res.json({
            success: true,
            message: "Item moved successfully.",
            data: drive.toJSON() // Convert Mongoose document to plain object
        });
    } catch (error) {
        handleDuplicateError(error);
    }
};

export const copyDrive = async (req: Request, res: Response) => {
    try {
        const session = req.local.session!;
        const driveToCopy = req.local.drive;
        const { newParentId } = driveMoveCopySchema.parse(req.body);

        if (!driveToCopy) {
            throw new Exception({ status: 404, message: "Item to copy not found.", type: "DRIVE_NOT_FOUND" });
        }

        if (newParentId) {
            const newParentDrive = await DriveModel.findOne({ _id: newParentId, userId: session.user._id, type: "folder" }).cache();
            if (!newParentDrive) {
                throw new Exception({ status: 404, message: "Target folder not found.", type: "NEW_PARENT_NOT_FOUND" });
            }
        }

        // Note: This only copies the top-level folder/file. 
        // If it's a folder, it will create an empty folder. Deep copying requires recursive duplication.
        const copiedDrive = new DriveModel({
            userId: session.user._id,
            name: driveToCopy.name + " - Copy",
            type: driveToCopy.type,
            metadata: driveToCopy.metadata,
            parentId: newParentId ? new Types.ObjectId(newParentId) : null
        });

        await copiedDrive.save();

        res.status(201).json({
            success: true,
            message: "Item copied successfully.",
            data: copiedDrive.toJSON() // Convert Mongoose document to plain object
        });
    } catch (error) {
        handleDuplicateError(error);
    }
};