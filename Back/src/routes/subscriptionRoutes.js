/**
 * Declara os endpoints do módulo de assinaturas (montado em "/api/subscriptions"):
 * webhook do Mercado Pago, sincronização de status, cancelamento e criação
 * de assinatura para um plano.
 * Autenticação: a rota /webhook é pública (assinada pelo Mercado Pago);
 * /sync, /:id/cancel e /:planId exigem authMiddleware.
 */
import express from "express";
import { SubscriptionController } from "../controllers/subscriptionController.js";
import { SubscriptionSyncController } from "../controllers/subscriptionSyncController.js";
import { SubscriptionCancelController } from "../controllers/subscriptionCancelController.js";
import { authMiddleware } from "../utils/auth.js";

import { MercadoPagoWebhookController } from "../controllers/mercadoPagoWebhookController.js";

const router = express.Router();
const subscriptionController = new SubscriptionController();
const syncController = new SubscriptionSyncController();
const cancelController = new SubscriptionCancelController();
const webhookController = new MercadoPagoWebhookController();

router.post("/webhook", webhookController.handle.bind(webhookController));

router.post("/sync", authMiddleware, syncController.handle.bind(syncController),);

  router.post("/:id/cancel", authMiddleware, cancelController.handle.bind(cancelController),);

router.post("/:planId", authMiddleware, subscriptionController.create.bind(subscriptionController),);

export default router;