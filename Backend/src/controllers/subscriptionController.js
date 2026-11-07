import { randomUUID } from "node:crypto";
import { AppDataSource } from "../../data-source.js";

import { UserEntity } from "../entities/User.js";
import { PlanEntity } from "../entities/Plan.js";
import { SubscriptionEntity } from "../entities/Subscription.js";

import { createMonthlySubscription } from "../services/mercadoPagoSubscriptionService.js";

export class SubscriptionController {
  async create(req, res) {
    let subscription;

    try {
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({
          message: "Usuário não autenticado.",
        });
      }

      const planId = Number(req.params.planId);

      if (!Number.isInteger(planId) || planId <= 0) {
        return res.status(400).json({
          message: "ID do plano inválido.",
        });
      }

      const userRepo = AppDataSource.getRepository(UserEntity);
      const planRepo = AppDataSource.getRepository(PlanEntity);
      const subscriptionRepo = AppDataSource.getRepository(SubscriptionEntity);

      const user = await userRepo.findOneBy({ id: userId });

      if (!user || !user.active) {
        return res.status(403).json({
          message: "Usuário inexistente ou inativo.",
        });
      }

      if (!user.email) {
        return res.status(400).json({
          message: "O usuário precisa ter um e-mail cadastrado.",
        });
      }

      const plan = await planRepo.findOneBy({
        id: planId,
        activate: true,
      });

      if (!plan) {
        return res.status(404).json({
          message: "Plano não encontrado ou desativado.",
        });
      }

      if (!Number.isFinite(Number(plan.value)) || Number(plan.value) <= 0) {
        return res.status(400).json({
          message: "O plano possui um valor inválido.",
        });
      }

      const externalReference = randomUUID();

      subscription = await subscriptionRepo.save({
        user_id: user.id,
        plan_id: plan.id,
        status: "pending",
        external_reference: externalReference,
        amount: Number(plan.value),
        currency: "BRL",
      });

      const mercadoPagoSubscription = await createMonthlySubscription({
        plan,
        payerEmail:
          process.env.NODE_ENV === "production"
            ? user.email
            : process.env.MP_TEST_PAYER_EMAIL || user.email,
        externalReference,
      });

      subscription.mercado_pago_subscription_id = mercadoPagoSubscription.id;

      subscription.status = mercadoPagoSubscription.status || "pending";

      await subscriptionRepo.save(subscription);

      return res.status(201).json({
        message: "Assinatura criada. Conclua a autorização no Mercado Pago.",
        subscriptionId: subscription.id,
        status: subscription.status,
        checkoutUrl: mercadoPagoSubscription.checkoutUrl,
      });
    } catch (error) {
      console.error("Erro ao criar assinatura:", error);

      if (subscription) {
        try {
          const subscriptionRepo =
            AppDataSource.getRepository(SubscriptionEntity);

          subscription.status = "creation_error";
          await subscriptionRepo.save(subscription);
        } catch (dbError) {
          console.error("Erro ao atualizar a assinatura:", dbError);
        }
      }

      return res.status(500).json({
        message: "Não foi possível iniciar a assinatura.",
      });
    }
  }
}
