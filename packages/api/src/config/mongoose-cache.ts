import mongoose from "mongoose";
import { redis } from "bun"; // must use bun do not change

// 1. Tell TypeScript about our new .cache() method
declare module "mongoose" {
    interface Query<ResultType, DocType, THelpers = {}, RawDocType = unknown> {
        useCache: boolean;
        hashKey: string;
        ttlSec: number;
        cache(ttlSec?: number, customKey?: string): this;
    }
}

// 2. Save a reference to the original Mongoose exec function
const originalExec = mongoose.Query.prototype.exec;

// 3. Create the chainable .cache() method
mongoose.Query.prototype.cache = function (ttlSec = 60, customKey = "") {
    this.useCache = true;
    this.ttlSec = ttlSec;

    // Safely access the collection name by casting 'this' to any to bypass strict internal TS types
    const collectionName = (this as any).model.collection.name;

    this.hashKey = customKey || JSON.stringify({
        ...this.getQuery(),
        collection: collectionName
    });

    return this;
};

// 4. Override the .exec() function to intercept the query
mongoose.Query.prototype.exec = async function () {
    if (!this.useCache) {
        return originalExec.apply(this, arguments as any);
    }

    const key = `query_cache:${this.hashKey}`;
    const cachedResult = await redis.get(key);

    if (cachedResult) {
        const doc = JSON.parse(cachedResult);

        // Use the official getOptions() method to check if .lean() was called
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