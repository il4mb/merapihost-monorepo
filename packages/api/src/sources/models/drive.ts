import { InferSchemaType, Schema, Types } from "mongoose";
import { primaryDb } from "@/sources";
import { CacheClearPlugin } from "@/utils/cache";
import { Exception } from "@/utils/exception";

const driveMetadataSchema = new Schema({
    size: { type: Number, default: 0 },
    mimeType: { type: String, default: null },
    bucket: { type: String, default: null },
    objKey: { type: String, default: null }
}, {
    _id: false
});

const driveSchema = new Schema({
    userId: { type: Types.ObjectId, ref: "User", required: true, index: true },
    parentId: { type: Types.ObjectId, ref: "Drive", default: null },
    name: { type: String, required: true },
    type: { type: String, enum: ["file", "folder"], required: true },
    metadata: { type: driveMetadataSchema, default: null }
}, {
    timestamps: true
});

driveSchema.index({ userId: 1, parentId: 1, name: 1 }, { unique: true });
driveSchema.plugin(CacheClearPlugin);

driveSchema.options.toJSON = {
    transform: function (doc, ret) {
        // @ts-ignore
        delete ret.__v;
        return ret;
    }
};

driveSchema.post('findOneAndDelete', async function (deletedDoc) {
    if (!deletedDoc) return;

    // Only folders can have children
    if (deletedDoc.type === "folder") {
        try {
            // 1. Find all immediate children of the deleted folder
            const children = await DriveModel.find({ parentId: deletedDoc._id });

            // 2. Recursively delete each child 
            // Calling findByIdAndDelete guarantees the hook triggers recursively for nested subfolders!
            for (const child of children) {
                await DriveModel.findByIdAndDelete(child._id);
                
                // Optional: If the child is a file stored in S3/Object Storage,
                // cleanup the bucket object here using child.metadata?.objKey
            }
        } catch (error) {
            console.error(`[Mongoose Hook Error] Failed to cascade delete children for folder ${deletedDoc._id}:`, error);
        }
    }
});

export type IDrive = InferSchemaType<typeof driveSchema> & {
    _id: Types.ObjectId;
}

const DriveModel = primaryDb.model<IDrive>("Drive", driveSchema);

export default DriveModel;