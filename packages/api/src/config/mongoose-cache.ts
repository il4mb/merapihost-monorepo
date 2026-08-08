import mongoose from "mongoose";
import { redis } from "bun"; 

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

    const collectionName = (this as any).model.collection.name;

    this.hashKey = customKey || JSON.stringify({
        ...this.getQuery(),
        collection: collectionName
    });

    return this;
};

mongoose.Query.prototype.exec = async function () {
    if (!this.useCache) {
        return originalExec.apply(this, arguments as any);
    }

    const key = `query_cache:${this.hashKey}`;
    const cachedResult = await redis.get(key);

    if (cachedResult) {
        const doc = JSON.parse(cachedResult);
        const isLean = this.getOptions().lean;

        if (isLean) {
            return doc;
        }

        // Re-hydrate into Mongoose Documents
        // Accessing the model constructor safely via (this as any).model
        const ModelConstructor = (this as any).model;
        return Array.isArray(doc)
            ? doc.map(d => new ModelConstructor(d))
            : new ModelConstructor(doc);
    }

    const result = await originalExec.apply(this, arguments as any);

    if (result) {
        await redis.set(key, JSON.stringify(result), "EX", this.ttlSec);
    }

    return result;
};