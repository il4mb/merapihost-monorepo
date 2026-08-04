import type { Types, HydratedDocument } from "mongoose";
import type { Service } from "@/sources/entities/service";
import type { WhatsappAccount } from "@/sources/entities/whatsapp-account";

import type { IWebsite, IServer, IUser, IDrive } from "@/sources/models";
// import type { DecodedIdToken } from "firebase-admin/auth";
import type { AuthTokenPayload } from "@/types/user";


// Helper type to enforce a plain object with the Mongoose _id included
type PlainDocument<T> = T & { _id: Types.ObjectId };

declare module "express-serve-static-core" {
    interface Request {
        local: {
            session?: AuthTokenPayload & {
                user: HydratedDocument<IUser>;
            };
            website?: HydratedDocument<IWebsite>;
            server?: HydratedDocument<IServer>;
            drive?: HydratedDocument<IDrive>;
        }
    }
}