/**
 * Declara os endpoints do módulo de notificações (prefixed em "/notifications"):
 * preferências de notificação do usuário (GET/PUT /preferences) e notificações
 * in-app (listagem, marcar como lida, marcar todas como lidas e execução
 * manual do job restrita a admin).
 * Autenticação: todas as rotas usam authMiddleware; a rota /run exige
 * adicionalmente checkRole("admin").
 */
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
