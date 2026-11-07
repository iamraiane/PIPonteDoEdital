import { AuthController } from "../controllers/userController.js";
import express from "express";
import { authMiddleware } from "../utils/auth.js";
import { checkRole } from "../middlewares/checkRoles.js";

const authController = new AuthController();
const router = express.Router();

router.post("/login", authController.login);
router.post("/users", authController.createUser);

router.get("/users", authMiddleware, checkRole("admin"), authController.getAllUsers);
router.get("/users/:id", authMiddleware, checkRole("admin", "user", "premium"), authController.getOneUser);
router.put("/users/:id", authMiddleware, checkRole("admin", "user", "premium"), authController.updateUser);
router.delete("/users/:id", authMiddleware, checkRole("admin"), authController.deleteUser);
router.patch("/users/:id/activate", authMiddleware, checkRole("admin"), authController.activateUser);
router.patch("/users/:id/disable", authMiddleware, checkRole("admin"), authController.disableUser);

router.patch("/users/:id/promoteToAdmin", authMiddleware, checkRole("admin"), authController.promoteToAdmin);
router.patch("/users/:id/demoteToUser", authMiddleware, checkRole("admin"), authController.demoteToUser);
router.patch("/users/:id/promoteToPremium", authMiddleware, checkRole("admin"), authController.promoteToPremium);


router.get("/users/:id/subscription", authMiddleware, checkRole("admin", "user", "premium"), authController.getUserSubscription);
router.post("/users/:id/activate-premium", authMiddleware, checkRole("admin", "user", "premium"), authController.activatePremium);


router.post("/auth/forgot-password", authController.forgotPassword);
router.post("/auth/reset-password", authController.resetPassword);
router.post("/verify-email", authController.verifyEmail);router.post("/change-email", authMiddleware, authController.toChangeYourEmail);
router.post("/confirm-email-change", authController.confirmEmailChange);
router.post("/resend-verification", authController.resendVerificationEmail);

export default router;