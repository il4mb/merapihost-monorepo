import { InferSchemaType, Schema, Types } from "mongoose";
import { primaryDb } from "@/sources";
import ServerModel from "./server";
import DomainModel from "./domain";

const websiteSchema = new Schema({
    userId: { type: String, required: true, index: true },
    domainId: { type: Types.ObjectId, ref: "Domain", required: true, unique: true, index: true },
    serverId: { type: Types.ObjectId, ref: "Server", required: true, index: true },
    name: { type: String, required: true },
    description: { type: String, default: null },
    status: { type: String, enum: ["active", "inactive"], default: "inactive" },
}, {
    timestamps: true
});

// Increment when a new website is created
websiteSchema.post('save', async function (doc) {
    try {
        await ServerModel.findByIdAndUpdate(doc.serverId, {
            $inc: { websiteCount: 1 }
        });
    } catch (error) {
        console.error(`[Mongoose Hook Error] Failed to increment count for server ${doc.serverId}:`, error);
    }

    try {

        await DomainModel.findByIdAndUpdate(doc.domainId, {
            $pull: { linked: { type: "website" } }
        });
        await DomainModel.findByIdAndUpdate(doc.domainId, {
            $push: { linked: { type: "website", refId: doc._id.toString() } }
        });

    } catch (error) {
        console.error(`[Mongoose Hook Error] Failed to update domain linked array for domain ${doc.domainId}:`, error);
    }
});

// Decrement when a website is deleted
websiteSchema.post('findOneAndDelete', async function (doc) {
    if (doc) {
        try {
            await ServerModel.findByIdAndUpdate(doc.serverId, {
                $inc: { websiteCount: -1 }
            });

            await DomainModel.findByIdAndUpdate(doc.domainId, {
                $pull: {
                    linked: { type: "website", refId: doc._id.toString() }
                }
            });
        } catch (error) {
            console.error(`[Mongoose Hook Error] Failed to run cleanups on deletion for website ${doc._id}:`, error);
        }
    }
});
export type IWebsite = InferSchemaType<typeof websiteSchema>;
const WebsiteModel = primaryDb.model<IWebsite>("Website", websiteSchema);

export default WebsiteModel;