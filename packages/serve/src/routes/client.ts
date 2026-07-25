import { Router } from "express";
import { resolveClientRequest } from "@/controllers/client";

const router = Router();
router.get("/{*path}", resolveClientRequest);

export default router;