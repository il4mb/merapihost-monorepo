import { InferSchemaType, Schema, Types } from "mongoose";
import { primaryDb } from "@/sources";
import { CacheClearPlugin } from "@/utils/cache";
import BucketModel from "./bucket";

const driveReferenceSchema = new Schema({
    type: { type: String, required: true },
    refId: { type: String, required: true }
}, {
    _id: false
});

const driveOptionSchema = new Schema({
    maxInodes: { type: Number, default: 100_000 }, // Number of files and folders in the drive
    maxUsage: { type: Number, default: 10 * 1024 * 1024 * 1024 } // Maximum storage usage in bytes,  0 means unlimited, default 10gb
}, {
    _id: false
});

const driveSchema = new Schema({
    bucketId: { type: Types.ObjectId, ref: "Bucket", required: true },
    reference: { type: driveReferenceSchema, required: true },
    options: { type: driveOptionSchema, default: {} },
}, {
    timestamps: true
});


driveSchema.index({ "reference.refId": 1, "reference.type": 1 }, { unique: true });
driveSchema.plugin(CacheClearPlugin);

driveSchema.post('save', async function (doc) {
    try {
        await BucketModel.findByIdAndUpdate(doc.bucketId, { $inc: { driveCount: 1 } });
    } catch (error) {
        console.error("Error updating bucket drive count:", error);
    }
});
driveSchema.post('findOneAndDelete', async function (doc) {
    try {
        await BucketModel.findByIdAndUpdate(doc.bucketId, { $inc: { driveCount: -1 } });
    } catch (error) {
        console.error("Error updating bucket drive count:", error);
    }
});
driveSchema.pre('findOneAndUpdate', async function () {
    const update = this.getUpdate() as any;
    const newBucketId = update.bucketId || update.$set?.bucketId;

    if (newBucketId) {
        const currentDoc = await this.model.findOne(this.getQuery());
        if (currentDoc && currentDoc.bucketId.toString() !== newBucketId.toString()) {
            (this as any)._oldBucketId = currentDoc.bucketId;
            (this as any)._newBucketId = newBucketId;
        }
    }
});
driveSchema.post('findOneAndUpdate', async function (doc) {
    const oldBucketId = (this as any)._oldBucketId;
    const newBucketId = (this as any)._newBucketId;

    if (oldBucketId && newBucketId) {
        try {
            await BucketModel.findByIdAndUpdate(oldBucketId, { $inc: { driveCount: -1 } });
            await BucketModel.findByIdAndUpdate(newBucketId, { $inc: { driveCount: 1 } });
        } catch (error) {
            console.error("Error updating bucket drive count after drive update:", error);
        }
    }
});

driveSchema.options.toJSON = {
    transform: function (doc, ret) {
        // @ts-ignore
        delete ret.__v;
        return ret;
    }
}

export type IDrive = InferSchemaType<typeof driveSchema> & {
    _id: Types.ObjectId;
}

const DriveModel = primaryDb.model<IDrive>("Drive", driveSchema);

export default DriveModel;