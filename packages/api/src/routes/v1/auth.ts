import { Router } from "express";
import * as authController from "@/controllers/auth";
import { authMiddleware } from "@/middlewares/auth.middleware";
const router = Router();

router.post("/login", authController.login);
router.post("/register", authController.register);

router.use(authMiddleware, () => {
    const authenticatedRouter = Router();
    authenticatedRouter.get("/me", authController.getMe);
    authenticatedRouter.post("/logout", authController.logout);
    return authenticatedRouter;
});


export default router;