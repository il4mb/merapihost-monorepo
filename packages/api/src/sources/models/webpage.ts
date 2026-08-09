import { InferSchemaType, Schema, Types } from "mongoose";
import { primaryDb } from "@/sources";
import { CacheClearPlugin } from "@/utils/cache";

const webpageSchema = new Schema({
    website: { type: Types.ObjectId, ref: "Website", required: true },
    route: { type: String, required: true },
    title: { type: String, required: true },
    description: { type: String, default: null },
    status: { type: String, enum: ["active", "inactive"], default: "inactive" }
}, {
    timestamps: true
});

webpageSchema.index({ website: 1, route: 1 }, { unique: true });
webpageSchema.plugin(CacheClearPlugin);

export type IWebpage = InferSchemaType<typeof webpageSchema>;
const WebpageModel = primaryDb.model<IWebpage>("Webpage", webpageSchema);

export default WebpageModel;