import { Service } from "@/utils/entities/service";

declare module "express" {
    interface Request {
        service?: Service;
    }
}