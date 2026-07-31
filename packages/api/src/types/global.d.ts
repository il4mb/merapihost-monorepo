import type { Service } from "@/utils/entities/service";
import type { WhatsappAccount } from "@/utils/entities/whatsapp-account";

declare module "express-serve-static-core" {
    interface Request {
        service?: Service;
        whatsappAccount?: WhatsappAccount;
    }
}

export { };