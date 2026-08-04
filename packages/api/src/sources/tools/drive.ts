import DriveNodeModel from "@/sources/models/drive-node";
import { Exception } from "@/utils/exception";
import { Types } from "mongoose";

/**
 * Checks if a child folder is inside a parent folder
 * @param childId the ID of the child folder
 * @param parentId the ID of the parent folder
 * @returns true if the child is inside the parent, false otherwise
 */
export const isDescendant = async (childId: Types.ObjectId, ancestorId: Types.ObjectId): Promise<boolean> => {
    let currentNode = await DriveNodeModel.findById(childId).lean();
    while (currentNode && currentNode.parentId) {
        if (currentNode.parentId.toString() === ancestorId.toString()) {
            return true;
        }
        currentNode = await DriveNodeModel.findById(currentNode.parentId).lean();
    }
    return false;
}

/**
 * Recursively copies a drive item (file or folder) and its children (if it's a folder) to a new parent folder.
 * @param sourceId the ID of the source drive item to copy
 * @param targetParentId the ID of the target parent folder where the item will be copied to (null for root)
 * @param driveId the ID of the drive to which the item belongs
 * @returns the newly created copied drive item
 */
export const copyRecursively = async (sourceId: Types.ObjectId, targetParentId: Types.ObjectId | null, driveId: Types.ObjectId) => {
    const sourceNode = await DriveNodeModel.findById(sourceId).lean();
    if (!sourceNode) {
        throw new Exception({
            status: 404,
            message: "Source drive not found.",
            type: "SOURCE_NOT_FOUND"
        });
    }

    // 1. Escape special characters in the source name for safe Regex usage
    const escapedName = sourceNode.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    // 2. Find all existing items in the target folder that share this base name
    // Matches: "Name", "Name - Copy", or "Name - Copy (any_number)"
    const nameRegex = new RegExp(`^${escapedName}( - Copy( \\(\\d+\\))?)?$`);

    const existingItems = await DriveNodeModel.find({
        driveId: driveId,
        parentId: targetParentId,
        name: { $regex: nameRegex }
    }).select("name").lean();

    let newName = sourceNode.name;
    // 3. If the exact name already exists, calculate the next available increment
    if (existingItems.some(item => item.name === sourceNode.name)) {
        let maxNumber = 0;
        let hasBaseCopy = false;
        for (const item of existingItems) {
            if (item.name === `${sourceNode.name} - Copy`) {
                hasBaseCopy = true;
            } else {
                // Extract the number from strings like "Name - Copy (2)"
                const match = item.name.match(new RegExp(`^${escapedName} - Copy \\((\\d+)\\)$`));
                if (match) {
                    const num = parseInt(match[1], 10);
                    if (num > maxNumber) {
                        maxNumber = num;
                    }
                }
            }
        }

        // Determine the next suffix
        if (maxNumber > 0) {
            newName = `${sourceNode.name} - Copy (${maxNumber + 1})`;
        } else if (hasBaseCopy) {
            newName = `${sourceNode.name} - Copy (1)`;
        } else {
            newName = `${sourceNode.name} - Copy`;
        }
    }

    // 4. Create the copy in the database
    const copiedNode = new DriveNodeModel({
        driveId: driveId,
        name: newName,
        type: sourceNode.type,
        metadata: sourceNode.metadata,
        parentId: targetParentId
    });

    await copiedNode.save();

    // 5. Recursively copy children if it is a folder
    if (sourceNode.type === "folder") {
        const children = await DriveNodeModel.find({ parentId: sourceId }).lean();
        for (const child of children) {
            // Children being copied into the brand new copiedDrive folder won't have conflicts,
            // but running them through the same function guarantees safety.
            await copyRecursively(child._id, copiedNode._id, driveId);
        }
    }
    return copiedNode; // Return the top-level copied drive
}