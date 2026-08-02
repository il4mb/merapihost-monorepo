import WebsiteModel from "@/sources/models/website";
import { Exception } from "@/utils/exception";
import { Request, Response, NextFunction } from "express";
import { Types } from "mongoose";

export const websiteOwnerMiddleware = (req: Request, res: Response, next: NextFunction) => {
    const id = req.params.id;

    if (!req.user || !req.user.id) {
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
    const website = WebsiteModel.findById({
        _id: new Types.ObjectId(id),
        userId: req.user?.id
    });


    next();
}