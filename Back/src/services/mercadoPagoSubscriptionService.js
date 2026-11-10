import { MercadoPagoConfig, PreApproval } from "mercadopago";

let preApproval;

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