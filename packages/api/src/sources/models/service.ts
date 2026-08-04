import { InferSchemaType, Schema, Types } from "mongoose";
import { primaryDb } from "@/sources";
import { CacheClearPlugin } from "@/utils/cache";

const serviceSchema = new Schema({
    userId: { type: Types.ObjectId, required: true, ref: "User" },
    type: { type: String, enum: ["website", "email", "whatsapp", "chatbot"], required: true },
    expiredAt: { type: Date, required: true },
}, {
    timestamps: true
});

serviceSchema.index({ userId: 1, type: 1 }, { unique: true });
serviceSchema.plugin(CacheClearPlugin);

export type IService = InferSchemaType<typeof serviceSchema>;
const ServiceModel = primaryDb.model<IService>("Service", serviceSchema);


export default ServiceModel;

