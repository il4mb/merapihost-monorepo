import { Service } from "@/entities/service";

declare module "express" {
    interface Request {
        service?: Service;
    }
}