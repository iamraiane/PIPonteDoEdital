import { In } from "typeorm";
import { MercadoPagoConfig, PreApproval } from "mercadopago";

import { AppDataSource } from "../../data-source.js";
import { SubscriptionEntity } from "../entities/Subscription.js";
import { UserEntity } from "../entities/User.js";

/** Cliente de configuração do Mercado Pago autenticado com o access token do ambiente. */
const client = new MercadoPagoConfig({
  accessToken: process.env.MP_ACCESS_TOKEN,
});
/** Instância de PreApproval usada para consultar e atualizar assinaturas no Mercado Pago. */
const preApproval = new PreApproval(client);

/** Status de assinatura aceitos ao sincronizar com o Mercado Pago. */
const ALLOWED_STATUSES = ["pending", "authorized", "paused", "cancelled"];
/** Status de assinatura que devem ser sincronizados com o Mercado Pago. */
const SYNCABLE_STATUSES = ["pending", "authorized", "paused"];

/**
 * Atualiza o papel (role) do usuário conforme suas assinaturas ativas.
 * Promove para "premium" se houver assinatura "authorized" e rebaixa para "user" se não houver.
 * @param {number|string} userId - Identificador do usuário.
 * @returns {Promise<string|null>} Papel final do usuário ou null se não encontrado.
 */
export async function refreshPremiumRole(userId) {
  const subscriptionRepo = AppDataSource.getRepository(SubscriptionEntity);
  const userRepo = AppDataSource.getRepository(UserEntity);

  const user = await userRepo.findOneBy({ id: userId });

  if (!user) {
    return null;
  }

  const activeSubscriptions = await subscriptionRepo.count({
    where: { user_id: userId, status: "authorized" },
  });

  if (activeSubscriptions > 0 && user.role === "user") {
    user.role = "premium";
    await userRepo.save(user);
  } else if (activeSubscriptions === 0 && user.role === "premium") {
    user.role = "user";
    await userRepo.save(user);
  }

  return user.role;
}
/**
 * Sincroniza as assinaturas do usuário com o Mercado Pago.
 * Consulta cada assinatura elegível, atualiza o status divergente e recalcula o papel do usuário.
 * @param {number|string} userId - Identificador do usuário.
 * @returns {Promise<{role: string|null, subscriptions: Array<object>}>} Papel resultante e detalhe de cada assinatura processada.
 */
export async function syncUserSubscriptions(userId) {
  const subscriptionRepo = AppDataSource.getRepository(SubscriptionEntity);

  const subscriptions = await subscriptionRepo.find({
    where: { user_id: userId, status: In(SYNCABLE_STATUSES) },
  });

  const results = [];

  for (const subscription of subscriptions) {
    if (!subscription.mercado_pago_subscription_id) {
      continue;
    }

    try {
      const mpSubscription = await preApproval.get({
        id: subscription.mercado_pago_subscription_id,
      });

      if (mpSubscription.external_reference !== subscription.external_reference) {
        results.push({ id: subscription.id, skipped: "external_reference diferente" });
        continue;
      }

      if (!ALLOWED_STATUSES.includes(mpSubscription.status)) {
        results.push({ id: subscription.id, skipped: "status não reconhecido" });
        continue;
      }

      if (subscription.status !== mpSubscription.status) {
        subscription.status = mpSubscription.status;
        await subscriptionRepo.save(subscription);
      }

      results.push({ id: subscription.id, status: subscription.status });
    } catch (error) {
      console.error(
        "Erro ao sincronizar assinatura:",
        subscription.id,
        error.message,
      );
      results.push({ id: subscription.id, error: "falha ao consultar o Mercado Pago" });
    }
  }

  const role = await refreshPremiumRole(userId);

  return { role, subscriptions: results };
}

/**
 * Cancela a assinatura do usuário no Mercado Pago e localmente.
 * Lança erro com código "NOT_FOUND" se não existir ou "NO_MP_ID" se não tiver vínculo com o Mercado Pago.
 * @param {number|string} userId - Identificador do usuário dono da assinatura.
 * @param {number|string} subscriptionId - Identificador da assinatura a cancelar.
 * @returns {Promise<{id: number|string, status: string, role: string|null}>} Assinatura cancelada e papel resultante do usuário.
 * @throws {Error} Erro com .code "NOT_FOUND" ou "NO_MP_ID" quando a validação falha.
 */
export async function cancelUserSubscription(userId, subscriptionId) {
  const subscriptionRepo = AppDataSource.getRepository(SubscriptionEntity);

  const subscription = await subscriptionRepo.findOneBy({
    id: subscriptionId,
    user_id: userId,
  });

  if (!subscription) {
    const error = new Error("Assinatura não encontrada.");
    error.code = "NOT_FOUND";
    throw error;
  }

  if (!subscription.mercado_pago_subscription_id) {
    const error = new Error("Assinatura sem vínculo com o Mercado Pago.");
    error.code = "NO_MP_ID";
    throw error;
  }

  if (subscription.status !== "cancelled") {
    await preApproval.update({
      id: subscription.mercado_pago_subscription_id,
      body: { status: "cancelled" },
    });

    subscription.status = "cancelled";
    await subscriptionRepo.save(subscription);
  }

  const role = await refreshPremiumRole(userId);

  return { id: subscription.id, status: subscription.status, role };
}