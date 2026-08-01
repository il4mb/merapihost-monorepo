
import type { Service } from "@/sources/entities/service";
import type { WhatsappAccount } from "@/sources/entities/whatsapp-account";
import type { DecodedIdToken } from "firebase-admin/auth";

declare module "express-serve-static-core" {
    interface Request {
        user?: DecodedIdToken;
        service?: Service;
        whatsappAccount?: WhatsappAccount;
    }
}

export { };