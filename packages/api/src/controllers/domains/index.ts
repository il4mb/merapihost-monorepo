import { Request, Response } from "express";
import DomainModel from "@/sources/models/domain";
import { createDomainSchema } from "@/sources/schemas/domain";
import { Exception } from "@/utils/exception";

export const listDomains = async (req: Request, res: Response) => {
    const domains = await DomainModel.find().cache();
    res.json({
        success: true,
        data: domains
    });
}


export const createDomain = async (req: Request, res: Response) => {
    const session = req.local.session;
    const patch = createDomainSchema.parse(req.body);

    if (!session) {
        throw new Exception({
            status: 401,
            message: "Unauthorized",
            type: "UNAUTHORIZED"
        });
    }
    if (!session.user.isVerified) {
        throw new Exception({
            status: 403,
            message: "Cannot create domain, user is not verified.",
            type: "USER_NOT_VERIFIED"
        });
    }

    const existingDomain = await DomainModel.findOne({ name: patch.domain }).cache();
    if (existingDomain) {
        throw new Exception({
            status: 400,
            message: "Domain already exists.",
            type: "DOMAIN_EXISTS"
        });
    }

    const randomHex = Bun.randomUUIDv7("hex").replace(/-/g, "");
    const uidPrefix = session.user._id.toString().slice(0, 8);
    const verificationToken = `${uidPrefix}-${randomHex}`;

    const domainDoc = await DomainModel.create({
        userId: session.user._id,
        name: patch.domain,
        type: patch.type,
        verificationToken: verificationToken,
        status: "pending"
    });

    res.status(201).json({
        success: true,
        message: "Domain created successfully.",
        data: domainDoc
    });
}