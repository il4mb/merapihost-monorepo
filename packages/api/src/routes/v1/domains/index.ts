import * as domainControllers from "@/controllers/domains";
import { Router } from "express";

const router = Router();

router.get("/", domainControllers.listDomains);
router.post("/", domainControllers.createDomain);

export default router;