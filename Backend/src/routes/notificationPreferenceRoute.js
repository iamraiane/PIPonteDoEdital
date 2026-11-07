import { Router } from "express";
import NotificationController from "../controllers/notificationPreferenceController.js";
import InAppNotificationController from "../controllers/notificationController.js";
import { authMiddleware } from "../utils/auth.js";
import { checkRole } from "../middlewares/checkRoles.js";

const router = Router();

router.get("/preferences", authMiddleware, NotificationController.getPreferences);
router.put("/preferences", authMiddleware, NotificationController.updatePreferences);

router.get("/", authMiddleware, InAppNotificationController.list);
router.post("/run", authMiddleware, checkRole("admin"), InAppNotificationController.runNow);
router.patch("/read-all", authMiddleware, InAppNotificationController.markAllRead);
router.patch("/:id/read", authMiddleware, InAppNotificationController.markRead);

export default router;
