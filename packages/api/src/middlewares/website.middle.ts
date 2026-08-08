import WebsiteModel from "@/sources/models/website";
import WebpageModel from "@/sources/models/webpage";
import { Exception } from "@/utils/exception";
import { Request, Response, NextFunction } from "express";
import { ObjectId } from "mongodb";

export const websiteOwnerMiddleware = async (req: Request, res: Response, next: NextFunction) => {
    const id = req.params.id;
    const user = req.local.session?.user;
    if (!user) {
        throw new Exception({
            status: 403,
            message: "User not authenticated.",
            type: "UNAUTHORIZED"
        })
    }

    if (!id || typeof id !== "string" || id.trim() === "") {
        throw new Exception({
            status: 400,
            message: "Invalid website ID.",
            type: "INVALID_WEBSITE_ID"
        });
    }
    const website = await WebsiteModel.findById({
        _id: new ObjectId(id),
        userId: user._id
    }).cache();

    if (!website) {
        throw new Exception({
            status: 404,
            message: "Website not found or you do not have permission to access it.",
            type: "WEBSITE_NOT_FOUND"
        });
    }

    req.local.website = website;

    next();
}

export const webpageMiddleware = async (req: Request, res: Response, next: NextFunction) => {
    const website = req.local.website;
    if (!website) {
        throw new Exception({
            status: 404,
            message: "Website not found or you do not have permission to access it.",
            type: "WEBSITE_NOT_FOUND"
        });
    }

    const webpageId = req.params.id;
    if (!webpageId || typeof webpageId !== "string" || webpageId.trim() === "") {
        throw new Exception({
            status: 400,
            message: "Invalid webpage ID.",
            type: "INVALID_WEBPAGE_ID"
        });
    }

    const webpage = await WebpageModel.findById({
        _id: new ObjectId(webpageId),
        websiteId: website._id
    }).cache();

    if (!webpage) {
        throw new Exception({
            status: 404,
            message: "Webpage not found or you do not have permission to access it.",
            type: "WEBPAGE_NOT_FOUND"
        });
    }

    req.local.webpage = webpage;

    next();
    
}