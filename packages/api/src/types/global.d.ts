import type { HydratedDocument } from "mongoose";
import type { Service } from "@/sources/entities/service";
import type { WhatsappAccount } from "@/sources/entities/whatsapp-account";
import type { IWebsite, IServer } from "@/sources/models";
import type { DecodedIdToken } from "firebase-admin/auth";

declare module "express-serve-static-core" {
    interface Request {
        // service?: Service;
        // server?: HydratedDocument<IServer>;
        // whatsappAccount?: WhatsappAccount;

        local: {
            user?: DecodedIdToken;
            website?: HydratedDocument<IWebsite>;
            server?: HydratedDocument<IServer>;
        }
    }
}

export { };