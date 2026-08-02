import { Router } from "express";
import * as authController from "@/controllers/auth";
import { authMiddleware } from "@/middlewares";

const router = Router();

router.post("/login", authController.login);
router.post("/register", authController.register);

const authenticatedRouter = Router();
authenticatedRouter.get("/me", authController.getMe);
authenticatedRouter.post("/logout", authController.logout);
router.use(authMiddleware, authenticatedRouter);

export default router;