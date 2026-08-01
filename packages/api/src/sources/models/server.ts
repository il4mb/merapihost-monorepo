import { Schema, model } from "mongoose";

export interface IServerMetadata {
    name: string;
    timestamp: string;
    system: {
        platform: string;
        architecture: string;
    };
    totalStorage: number;
    totalMemory: number;
    cpu: {
        cores: number;
        model: string;
    };
}

export type IServer = {
    hostname: string;
    description?: string;
    masterKey: string;
    isActive: boolean;
    metadata?: IServerMetadata;
    createdAt: Date;
    updatedAt: Date;
};

const serverSchema = new Schema<IServer>({
    hostname: { type: String, required: true, unique: true },
    description: { type: String, default: null },
    masterKey: { type: String, required: true },
    isActive: { type: Boolean, default: true },
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

export const ServerModel = model<IServer>("Server", serverSchema);

