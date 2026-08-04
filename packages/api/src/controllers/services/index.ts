import { Request, Response } from "express";
import ServiceModel from "@/sources/models/service";
// Import your target models
import WebsiteModel, { IWebsite } from "@/sources/models/website";
import EmailModel, { IEmail } from "@/sources/models/email";

export const getListService = async (req: Request, res: Response) => {
    const session = req.local.session;
    if (!session) {
        return res.status(401).json({
            success: false,
            message: "Unauthorized",
            type: "UNAUTHORIZED"
        });
    }

    // 1. Fetch the base services
    const services = await ServiceModel.find({
        userId: session.user._id
    }).lean().cache();

    if (!services.length) {
        return res.json({ success: true, data: [] });
    }

    // 2. Extract the Service IDs grouped by their type
    const websiteServiceIds = services
        .filter(s => s.type === "website")
        .map(s => s._id);

    const emailServiceIds = services
        .filter(s => s.type === "email")
        .map(s => s._id);

    // 3. Fetch related child data in parallel 
    // This finds all children that belong to the services we just fetched
    const [websites, emails] = await Promise.all([
        websiteServiceIds.length
            ? WebsiteModel.find({ serviceId: { $in: websiteServiceIds } }).lean().cache()
            : [],
        emailServiceIds.length
            ? EmailModel.find({ serviceId: { $in: emailServiceIds } }).lean().cache()
            : []
    ]) as [IWebsite[], IEmail[]]; // Type assertion for clarity

    // 4. Create O(1) lookup dictionaries mapped by `serviceId`
    // We use .toString() on the ObjectId to ensure strict string matching
    const websiteMap = new Map(websites.map(w => [w.serviceId.toString(), w]));
    const emailMap = new Map(emails.map(e => [e.serviceId.toString(), e]));

    // 5. Merge the child data back into the parent services array
    const populatedServices = services.map(service => {
        let details: any = null;
        const serviceIdString = service._id.toString();

        // Look up the child record based on the service's type and ID
        if (service.type === "website") {
            details = websiteMap.get(serviceIdString) || null;
        } else if (service.type === "email") {
            details = emailMap.get(serviceIdString) || null;
        }

        return {
            ...service,
            details // Attach the joined child document here
        };
    });

    res.json({
        success: true,
        data: populatedServices
    });
}