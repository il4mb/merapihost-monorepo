import dns from "node:dns/promises";
import { Request, Response, NextFunction } from "express";
import { getConnection } from "@/connection";
import { Service } from "@/entities/service";

const TXT_PREFIX = "merapihost-verification";

export async function domainVerifyMiddleware(req: Request, res: Response, next: NextFunction) {

    const domain = req.hostname;
    const db = await getConnection();
    const serviceRepository = db.getRepository(Service);
    const service = await serviceRepository.findOne({ where: { domain } });

    if (!service) {
        return res.status(403).json({
            error: "Domain is not registered",
        });
    }
    try {

        const records = await dns.resolveTxt(service.domain);
        const txtRecords = records.map(record => record.join(""));
        const isVerified = txtRecords.some(record => {
            const [prefix, code] = record.split("=");
            return prefix === TXT_PREFIX && code === service.domainVerifyToken;
        });

        if (!isVerified) {
            return res.status(403).render("domain-error", {
                domain: service.domain,
                serverName: process.env.SERVER_NAME || "Merapihost",
                error: "Domain verification failed. Please ensure the correct TXT record is set in your DNS settings."
            });
        }
        /**
         * If the domain is verified, attach the service to the request object and proceed to the next middleware or route handler.
         */
        req.service = service;
        next();

    } catch (err: any) {
        if (err.code === "ENOTFOUND" || err.code === "ENODATA") {
            return res.status(403).json({
                error: "TXT record not found",
            });
        }
        return res.status(500).json({
            error: "DNS lookup failed",
        });
    }
}