import {
  MercadoPagoConfig,
  PreApproval,
  WebhookSignatureValidator,
} from "mercadopago";

import { AppDataSource } from "../../data-source.js";
import { SubscriptionEntity } from "../entities/Subscription.js";
import { UserEntity } from "../entities/User.js";

const accessToken = process.env.MP_ACCESS_TOKEN;
const webhookSecret = process.env.MP_WEBHOOK_SECRET;

console.log("Segredo carregado no controller:", Boolean(webhookSecret));

const client = new MercadoPagoConfig({ accessToken });
const preApproval = new PreApproval(client);

export class MercadoPagoWebhookController {
  async handle(req, res) {
    if (!webhookSecret) {
      console.error("MP_WEBHOOK_SECRET não configurado.");
      return res.sendStatus(500);
    }

    const dataId = req.query["data.id"];

    console.log("Dados recebidos para validação:", {
      dataId: String(dataId),
      xRequestId: req.headers["x-request-id"],
      xSignature: req.headers["x-signature"],
    });

    console.log("Diagnóstico do webhook:", {
      temXSignature: Boolean(req.headers["x-signature"]),
      temXRequestId: Boolean(req.headers["x-request-id"]),
      temDataId: Boolean(dataId),
      temWebhookSecret: Boolean(webhookSecret),
    });

    // 1. Valida a assinatura criptográfica da notificação
    try {
      WebhookSignatureValidator.validate({
        xSignature: req.headers["x-signature"],
        xRequestId: req.headers["x-request-id"],
        dataId: dataId ? String(dataId) : undefined,
        secret: webhookSecret,
      });
    } catch (error) {
      console.error("Erro na validação do webhook:", {
        name: error.name,
        message: error.message,
      });

      return res.sendStatus(401);
    }

    // 2. Confirma se a notificação é sobre uma assinatura
    const topic = req.body?.type ?? req.query.type;

    if (topic !== "subscription_preapproval") {
      return res.sendStatus(200);
    }

    if (!dataId) {
      return res.status(400).json({
        message: "Identificador da assinatura ausente.",
      });
    }

    try {
      // 3. Busca o estado verdadeiro na API do Mercado Pago
      const mpSubscription = await preApproval.get({
        id: String(dataId),
      });

      const subscriptionRepo = AppDataSource.getRepository(SubscriptionEntity);

      const userRepo = AppDataSource.getRepository(UserEntity);

      // 4. Localiza o registro correspondente no nosso banco
      const subscription = await subscriptionRepo.findOne({
        where: [
          {
            mercado_pago_subscription_id: String(mpSubscription.id),
          },
          {
            external_reference: mpSubscription.external_reference,
          },
        ],
      });

      if (!subscription) {
        console.error("Assinatura do Mercado Pago não encontrada no banco.");

        // Pode ser uma notificação recebida antes de salvar o ID.
        // Não liberamos acesso sem encontrar o registro correspondente.
        return res.sendStatus(200);
      }

      // 5. Atualiza somente com o estado consultado na API
      const allowedStatuses = ["pending", "authorized", "paused", "cancelled"];

      if (!allowedStatuses.includes(mpSubscription.status)) {
        console.warn("Estado de assinatura não reconhecido.");
        return res.sendStatus(200);
      }

      subscription.status = mpSubscription.status;

      if (!subscription.mercado_pago_subscription_id) {
        subscription.mercado_pago_subscription_id = String(mpSubscription.id);
      }

      await subscriptionRepo.save(subscription);

      // 6. Atualiza o acesso Premium com base nas assinaturas ativas
      const user = await userRepo.findOneBy({
        id: subscription.user_id,
      });

      if (!user) {
        return res.sendStatus(200);
      }

      const activeSubscriptions = await subscriptionRepo.count({
        where: {
          user_id: user.id,
          status: "authorized",
        },
      });

      if (activeSubscriptions > 0 && user.role === "user") {
        user.role = "premium";
        await userRepo.save(user);
      } else if (activeSubscriptions === 0 && user.role === "premium") {
        user.role = "user";
        await userRepo.save(user);
      }

      return res.sendStatus(200);
    } catch (error) {
      // Assinatura inexistente no Mercado Pago (ex.: simulação do painel com ID
      // inventado): responde 200 para o MP não reenviar a notificação.
      if (error.status === 404 || /not found/i.test(error.message || "")) {
        console.warn("Assinatura não encontrada no Mercado Pago:", dataId);
        return res.sendStatus(200);
      }

      console.error(
        "Erro ao processar webhook do Mercado Pago:",
        error.message,
      );

      return res.sendStatus(500);
    }
  }
}