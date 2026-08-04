import { InferSchemaType, Schema, Types } from "mongoose";
import { primaryDb } from "@/sources";
import { CacheClearPlugin } from "@/utils/cache";

const driveFileMetadataSchema = new Schema({
    size: { type: Number, default: 0 },
    mimeType: { type: String, default: null },
    bucket: { type: String, default: null },
    objKey: { type: String, default: null }
}, {
    _id: false
});

const driveNodeSchema = new Schema({
    driveId: { type: Types.ObjectId, ref: "Drive", required: true },
    parentId: { type: Types.ObjectId, ref: "DriveNode", default: null },
    name: { type: String, required: true },
    type: { type: String, enum: ["file", "folder"], required: true },
    metadata: { type: driveFileMetadataSchema, default: null }
}, {
    timestamps: true
});

// FIX: Added ": 1" to assign the ascending sort direction to the nested field
driveNodeSchema.index({ driveId: 1, parentId: 1, name: 1 }, { unique: true });
driveNodeSchema.plugin(CacheClearPlugin);

driveNodeSchema.options.toJSON = {
    transform: function (doc, ret: any) {
        delete ret.__v;
        delete ret.driveId; // Remove driveId from the JSON output
        delete ret.parentId;
        return ret;
    }
};

driveNodeSchema.post('findOneAndDelete', async function (deletedDoc) {
    if (!deletedDoc) return;

    // Only folders can have children
    if (deletedDoc.type === "folder") {
        try {
            // 1. Find all immediate children of the deleted folder
            const children = await DriveNodeModel.find({ parentId: deletedDoc._id });

            // 2. Recursively delete each child 
            // Calling findByIdAndDelete guarantees the hook triggers recursively for nested subfolders!
            for (const child of children) {
                await DriveNodeModel.findByIdAndDelete(child._id);

                // Optional: If the child is a file stored in S3/Object Storage,
                // cleanup the bucket object here using child.metadata?.objKey
            }
        } catch (error) {
            console.error(`[Mongoose Hook Error] Failed to cascade delete children for folder ${deletedDoc._id}:`, error);
        }
    }
});

export type IDriveNode = InferSchemaType<typeof driveNodeSchema> & {
    _id: Types.ObjectId;
}

const DriveNodeModel = primaryDb.model<IDriveNode>("DriveNode", driveNodeSchema);

export default DriveNodeModel;