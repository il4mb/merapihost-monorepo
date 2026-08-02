import { InferSchemaType, Schema, model } from "mongoose";
import { primaryDb } from "@/sources";

const serverSchema = new Schema({
    hostname: { type: String, required: true, unique: true },
    description: { type: String, default: null },
    masterKey: { type: String, required: true },
    isActive: { type: Boolean, default: true },
    websiteCount: { type: Number, default: 0 },
    metadata: {
        name: { type: String },
        timestamp: { type: String },
        system: {
            platform: { type: String },
            architecture: { type: String }
        },
        totalStorage: { type: Number },
        totalMemory: { type: Number },
        cpu: {
            cores: { type: Number },
            model: { type: String }
        }
    }
}, {
    timestamps: true
});

export type IServer = InferSchemaType<typeof serverSchema>;
export type IServerMetadata = IServer["metadata"];

const ServerModel = primaryDb.model<IServer>("Server", serverSchema);

export default ServerModel;

