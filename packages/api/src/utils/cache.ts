import mongoose, { Schema } from "mongoose";
import { redis } from "bun";
import { LOGGER } from "./logger";

declare module "mongoose" {
    interface Query<ResultType, DocType, THelpers = {}, RawDocType = unknown> {
        useCache: boolean;
        hashKey: string;
        ttlSec: number;
        cache(ttlSec?: number, customKey?: string): this;
    }
}

const originalExec = mongoose.Query.prototype.exec;

mongoose.Query.prototype.cache = function (ttlSec = 60, customKey = "") {
    this.useCache = true;
    this.ttlSec = ttlSec;
    const collectionName = (this as any).model?.collection?.name;
    this.hashKey = customKey || collectionName;
    return this;
};

mongoose.Query.prototype.exec = async function () {
    if (!this.useCache) {
        return originalExec.apply(this, arguments as any);
    }

    const collectionName = this.hashKey;
    const queryObj = this.getQuery();

    // Detect if this is a simple ID lookup (e.g., findById)
    const isIdLookup = queryObj._id && Object.keys(queryObj).length === 1 &&
        (typeof queryObj._id === "string" || mongoose.isValidObjectId(queryObj._id));

    let topLevelKey = "";
    let queryField = "";

    // Route to the appropriate Hash
    if (isIdLookup) {
        topLevelKey = `mongoose_cache:${collectionName}:ids`;
        queryField = queryObj._id.toString();
    } else {
        topLevelKey = `mongoose_cache:${collectionName}:lists`;
        queryField = JSON.stringify(queryObj);
    }

    try {
        const cachedResult = await redis.hget(topLevelKey, queryField);

        if (cachedResult) {
            LOGGER.info(`[Cache] Hit for ${isIdLookup ? 'ID' : 'List'} key: ${topLevelKey}, field: ${queryField}`);
            const doc = JSON.parse(cachedResult);
            const isLean = this.getOptions().lean;

            if (isLean) return doc;

            const ModelConstructor = (this as any).model;
            return Array.isArray(doc)
                ? doc.map(d => ModelConstructor.hydrate(d))
                : ModelConstructor.hydrate(doc);
        }
    } catch (error) {
        LOGGER.error(`[Cache] Redis HGET error for ${topLevelKey}:`, error);
    }

    const result = await originalExec.apply(this, arguments as any);

    if (result !== undefined && result !== null) {
        try {
            await redis.hset(topLevelKey, queryField, JSON.stringify(result));
            await redis.expire(topLevelKey, this.ttlSec);
        } catch (error) {
            LOGGER.error(`[Cache] Redis HSET error for ${topLevelKey}:`, error);
        }
    }

    return result;
};


export const CacheClearPlugin = (schema: Schema) => {

    // Helper function to process targeted cache clearing
    const clearTargetedCache = async (collectionName: string, docId?: string) => {
        if (!collectionName) return;

        try {
            // 1. Delete ONLY the specific document from the ID cache
            if (docId) {
                await redis.hdel(`mongoose_cache:${collectionName}:ids`, docId);
                LOGGER.info(`[Cache] Cleared specific ID (${docId}) for collection: ${collectionName}`);
            }

            // 2. Always clear the list cache, as the updated doc might affect lists
            const listKey = `mongoose_cache:${collectionName}:lists`;
            await redis.del(listKey);
            LOGGER.info(`[Cache] Cleared lists for collection: ${collectionName}`);

        } catch (error) {
            LOGGER.error(`[Cache] Error clearing targeted cache for ${collectionName}:`, error);
        }
    };

    // 1. Invalidate on Document methods (e.g., user.save(), user.deleteOne())
    const documentMethods = ["save", "remove", "deleteOne"];

    documentMethods.forEach((method) => {
        schema.post(method as any, async function (doc: any) {
            const collectionName = (this.constructor as any)?.collection?.name
                || doc?.constructor?.collection?.name;

            // Extract ID from the document itself
            const docId = doc?._id?.toString() || this._id?.toString();

            await clearTargetedCache(collectionName, docId);
        });
    });

    // 2. Invalidate on Query methods (e.g., UserModel.findOneAndUpdate())
    const queryMethods = [
        "findOneAndUpdate",
        "findOneAndDelete",
        "findByIdAndUpdate",
        "findByIdAndDelete",
        "updateMany",
        "updateOne",
        "deleteMany"
    ];

    queryMethods.forEach((method) => {
        schema.post(method as any, async function (res: any) {
            const collectionName = (this as any).mongooseCollection?.name
                || (this as any).model?.collection?.name;

            // Extract ID from the result (if returned) OR from the query filter
            const docId = res?._id?.toString() || (this.getQuery() as any)?._id?.toString();

            await clearTargetedCache(collectionName, docId);
        });
    });
};