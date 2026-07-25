import { render } from "@/client/render";
import { getConnection } from "@/connection";
import { Webpage } from "@/entities/webpage";
import { Request, Response } from "express";

export const resolveClientRequest = async (req: Request, res: Response) => {

    const service = req.service!;
    const path = (req.params.path ? String(req.params.path) : "/").trim().toLowerCase();
    const db = await getConnection();
    const webpageRepository = db.getRepository(Webpage);

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
     * If a webpage is found, use the render function to generate the HTML content for the page.
     * The render function takes the path and service as arguments and returns an object containing the title, meta tags, styles, and HTML content.
     */
    const data = render({ path, service });

    /**
     * Render the "skeleton" template with the generated data.
     * The template is provided with the language, title, meta tags, styles, and HTML content to be displayed on the page.
     */
    return res.status(200).render("skeleton", {
        lang: "en",
        service: service,
        title: data.title,
        meta: data.meta,
        styles: data.styles,
        content: data.html,
        blocks: data.blocks
    });

}