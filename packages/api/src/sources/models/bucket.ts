import { InferSchemaType, Schema } from "mongoose";
import { primaryDb } from "@/sources";
import { CacheClearPlugin } from "@/utils/cache";

const bucketSchema = new Schema({
    name: { type: String, required: true, unique: true },
    endpoint: { type: String, required: true },
    secretKey: { type: String, required: true },
    accessKey: { type: String, required: true },
    driveCount: { type: Number, default: 0 } // Number of drives in the bucket
}, {
    timestamps: true
});

bucketSchema.plugin(CacheClearPlugin);

export type IBucket = InferSchemaType<typeof bucketSchema>;
const BucketModel = primaryDb.model<IBucket>("Bucket", bucketSchema);


export default BucketModel;

