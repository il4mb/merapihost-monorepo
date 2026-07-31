
import type { Service } from "@/utils/entities/service";
import type { WhatsappAccount } from "@/utils/entities/whatsapp-account";
import type { DecodedIdToken } from "firebase-admin/auth";

declare module "express-serve-static-core" {
    interface Request {
        user?: DecodedIdToken;
        service?: Service;
        whatsappAccount?: WhatsappAccount;
    }
}

export { };