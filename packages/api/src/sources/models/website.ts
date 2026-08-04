import { InferSchemaType, Schema, Types } from "mongoose";
import { primaryDb } from "@/sources";
import ServerModel from "./server";
import DomainModel from "./domain";
import { CacheClearPlugin } from "@/utils/cache";

const websiteSchema = new Schema({
    userId: { type: Types.ObjectId, ref: "User", required: true },
    domainId: { type: Types.ObjectId, ref: "Domain", required: true },
    serverId: { type: Types.ObjectId, ref: "Server", required: true },
    driveId: { type: Types.ObjectId, ref: "Drive", required: true, index: true },
    name: { type: String, required: true },
    description: { type: String, default: null },
    status: { type: String, enum: ["active", "inactive"], default: "inactive" }
}, {
    timestamps: true
});

websiteSchema.index({ userId: 1, domainId: 1, serverId: 1 }, { unique: true });

websiteSchema.plugin(CacheClearPlugin);

// --- CREATION HOOKS ---

websiteSchema.pre('save', function () {
    this.$locals.wasNew = this.isNew;
});

websiteSchema.post('save', async function (doc) {
    if (!this.$locals.wasNew) return;

    try {
        await ServerModel.findByIdAndUpdate(doc.serverId, { $inc: { websiteCount: 1 } });
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

// --- UPDATE HOOKS ---

websiteSchema.pre('findOneAndUpdate', async function () {
    const update = this.getUpdate() as any;

    const newDomainId = update.domainId || update.$set?.domainId;
    const newServerId = update.serverId || update.$set?.serverId;

    if (newDomainId || newServerId) {
        const currentDoc = await this.model.findOne(this.getQuery());
        if (currentDoc) {
            // Check if Domain is changing
            if (newDomainId && currentDoc.domainId?.toString() !== newDomainId.toString()) {
                (this as any)._oldDomainId = currentDoc.domainId; // Could be undefined/null, which is fine
                (this as any)._newDomainId = newDomainId;
            }
            // Check if Server is changing
            if (newServerId && currentDoc.serverId?.toString() !== newServerId.toString()) {
                (this as any)._oldServerId = currentDoc.serverId; // Could be undefined/null, which is fine
                (this as any)._newServerId = newServerId;
            }
        }
    }
});

websiteSchema.post('findOneAndUpdate', async function (doc) {
    if (!doc) return;

    const oldDomainId = (this as any)._oldDomainId;
    const newDomainId = (this as any)._newDomainId;

    console.log("New Domain ID:", newDomainId);

    const oldServerId = (this as any)._oldServerId;
    const newServerId = (this as any)._newServerId;

    // Handle Domain Update (Triggered solely by the presence of a newDomainId)
    if (newDomainId) {
        try {
            // 1. Remove website link from the OLD domain ONLY if it existed
            if (oldDomainId) {
                await DomainModel.findByIdAndUpdate(oldDomainId, {
                    $pull: { linked: { type: "website", refId: doc._id.toString() } }
                });
            }
            // 2. Clear any existing website link from the NEW domain
            await DomainModel.findByIdAndUpdate(newDomainId, {
                $pull: { linked: { type: "website" } }
            });
            // 3. Add website link to the NEW domain
            await DomainModel.findByIdAndUpdate(newDomainId, {
                $push: { linked: { type: "website", refId: doc._id.toString() } }
            });
            console.log(`Successfully swapped domain links for website ${doc._id}: oldDomainId=${oldDomainId}, newDomainId=${newDomainId}`);
        } catch (error) {
            console.error(`[Mongoose Hook Error] Failed to swap domain links for website ${doc._id}:`, error);
        }
    }

    // Handle Server Update (Triggered solely by the presence of a newServerId)
    if (newServerId) {
        try {
            // Decrement old server ONLY if it existed
            if (oldServerId) {
                await ServerModel.findByIdAndUpdate(oldServerId, { $inc: { websiteCount: -1 } });
            }
            // Increment new server
            await ServerModel.findByIdAndUpdate(newServerId, { $inc: { websiteCount: 1 } });
        } catch (error) {
            console.error(`[Mongoose Hook Error] Failed to update server counts for website ${doc._id}:`, error);
        }
    }
});

// --- DELETION HOOKS ---

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