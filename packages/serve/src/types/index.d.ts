import type { Service } from "@/utils/entities/service";
import type { Webpage } from "@/utils/entities/webpage";

declare module "express" {
    interface Request {
        service?: Service;
        webpage?: Webpage;
    }
}