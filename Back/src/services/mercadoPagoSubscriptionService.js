import { MercadoPagoConfig, PreApproval } from "mercadopago";

/** Instância singleton do cliente PreApproval do Mercado Pago (criada sob demanda). */
let preApproval;

/**
 * Obtém (ou cria uma única vez) a instância de PreApproval do Mercado Pago.
 * @returns {PreApproval} Cliente de assinaturas recorrentes do Mercado Pago.
 * @throws {Error} Se a variável de ambiente MP_ACCESS_TOKEN não estiver configurada.
 */
function getPreApproval() {
  if (!preApproval) {
    const accessToken = process.env.MP_ACCESS_TOKEN;

    if (!accessToken) {
      throw new Error("MP_ACCESS_TOKEN não foi configurado no .env");
    }

    preApproval = new PreApproval(new MercadoPagoConfig({ accessToken }));
  }

  return preApproval;
}

/**
 * Cria uma assinatura mensal recorrente no Mercado Pago.
 * Valida o plano e os dados obrigatórios e retorna o checkout para pagamento.
 * @param {{ plan: { name: string, value: number }, payerEmail: string, externalReference: string }} params - Dados da assinatura.
 * @param {object} params.plan - Plano a ser assinado (nome e valor).
 * @param {string} params.payerEmail - E-mail do pagador.
 * @param {string} params.externalReference - Referência externa para conciliação (ex.: id do usuário).
 * @returns {Promise<{id: string, checkoutUrl: string, status: string}>} Identificador, URL do checkout e status inicial da assinatura.
 * @throws {Error} Se o plano, o e-mail do pagador ou a referência externa forem inválidos.
 */
export async function createMonthlySubscription({
  plan,
  payerEmail,
  externalReference,
}) {
  if (!plan || !plan.name || plan.value == null) {
    throw new Error("Plano inválido.");
  }

  if (Number(plan.value) <= 0) {
    throw new Error("O valor do plano deve ser maior que zero.");
  }

  if (!payerEmail || !externalReference) {
    throw new Error("E-mail do pagador e referência externa são obrigatórios.");
  }

  const notificationUrl = process.env.MP_NOTIFICATION_URL;

  const response = await getPreApproval().create({
    body: {
      reason: `Assinatura mensal - ${plan.name}`,

      external_reference: externalReference,

      payer_email: payerEmail,

      auto_recurring: {
        frequency: 1,
        frequency_type: "months",
        transaction_amount: Number(plan.value),
        currency_id: "BRL",
      },

      back_url: `${process.env.FRONTEND_URL}/premium/retorno`,

      ...(notificationUrl ? { notification_url: notificationUrl } : {}),
    },
  });

  return {
    id: response.id,
    checkoutUrl: response.init_point,
    status: response.status,
  };
}