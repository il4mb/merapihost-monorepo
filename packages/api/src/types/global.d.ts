import type { Service } from "@/entities/service";
import type { WhatsappAccount } from "@/entities/whatsapp-account";

declare module "express-serve-static-core" {
    interface Request {
        service?: Service;
        whatsappAccount?: WhatsappAccount;
    }
}

export { };