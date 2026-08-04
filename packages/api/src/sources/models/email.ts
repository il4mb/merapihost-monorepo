import { InferSchemaType, Schema, Types } from "mongoose";
import { primaryDb } from "@/sources";
import { CacheClearPlugin } from "@/utils/cache";

const emailSchema = new Schema({
    serviceId: { type: Types.ObjectId, ref: "Service", required: true },
    domainId: { type: Types.ObjectId, ref: "Domain", required: true },
    serverId: { type: Types.ObjectId, ref: "Server", required: true },
    bucketId: { type: Types.ObjectId, ref: "Bucket", required: true },
    name: { type: String, required: true },
    description: { type: String, default: null },
    status: { type: String, enum: ["active", "inactive"], default: "inactive" }
}, {
    timestamps: true
});

emailSchema.index({ domainId: 1, serverId: 1, serviceId: 1 }, { unique: true });
emailSchema.plugin(CacheClearPlugin);

export type IEmail = InferSchemaType<typeof emailSchema>;
const EmailModel = primaryDb.model<IEmail>("Email", emailSchema);

export default EmailModel;