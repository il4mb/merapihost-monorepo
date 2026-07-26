import { render } from "@/client/render";
import { getRedis } from "@/config/redis";
import { getConnection } from "@/connection";
import { Webpage } from "@/entities/webpage";
import { BlockNode } from "@/types/client";
import { s3Client } from "@/utils/s3-client";
import { Request, Response } from "express";

const CACHE_TTL = 60 * 60 * 24; // 1 day in seconds

export const resolveClientRequest = async (req: Request, res: Response) => {

    const redis = await getRedis();
    const service = req.service!;
    const cacheKey = `webpage:${service.id}:${req.params.path || "/"}`;
    const path = (req.params.path ? String(req.params.path) : "/").trim().toLowerCase();
    const db = await getConnection();
    const webpageRepository = db.getRepository(Webpage);

    const cachedData = await redis.get(cacheKey);
    if (cachedData) {
        const { webpage, blocks } = JSON.parse(cachedData) as { webpage: Webpage, blocks: BlockNode[] };
        const data = render({ webpage, blocks });
        return res.status(200).render("skeleton", data);
    }

    /**
     * Attempt to find a webpage in the database that matches the requested path and is associated with the current service.
     * The search is performed using the service ID and the requested path.
     */
    const webpage = await webpageRepository.findOne({
        where: {
            service: { id: service.id },
            route: path.startsWith("/") ? path : `/${path}`,
        }
    });

    /**
     * If no webpage is found for the given path, render a default page or a 404 page based on the path.
     */
    if (!webpage) {
        /**
         * If the requested path is "/", render a default page with the service name.
         * Otherwise, render a 404 page indicating that the requested resource was not found.
         */
        if (path === "/") {
            return res.render("defaults", {
                serverName: service.name,
            });
        }
        return res.status(404).render("404", {
            serverName: service.name,
        });
    }

    /**
     * If a webpage is found, attempt to retrieve the associated blocks from S3 storage.
     * The blocks are stored in a JSON file located at "webpages/{webpage.id}/blocks.json" within the service's bucket.
     */
    const s3File = s3Client.file(`webpages/${webpage.id}/blocks.json`, {
        bucket: service.bucket
    });
    const blocks = ((await s3File.exists()) ? await s3File.json() : []) as BlockNode[];

    await redis.set(cacheKey, JSON.stringify({ webpage, blocks }));
    await redis.expire(cacheKey, CACHE_TTL);
    
    /**
     * Render the webpage using the retrieved blocks and webpage data.
     * The render function generates the necessary HTML content, styles, and other data required to display the webpage.
     */
    const data = render({ webpage, blocks });

    /**
     * Render the "skeleton" template with the generated data.
     * The template is provided with the language, title, meta tags, styles, and HTML content to be displayed on the page.
     */
    return res.status(200).render("skeleton", data);
}