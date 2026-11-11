import { syncUserSubscriptions } from "../services/subscriptionSyncService.js";

/**
 * Controller responsável pela sincronização de assinaturas do usuário.
 */
export class SubscriptionSyncController {
  /**
   * Sincroniza as assinaturas do usuário autenticado com o Mercado Pago.
   * Exige autenticação e delega a sincronização ao serviço;
   * responde 500 em caso de falha.
   * @param {import("express").Request} req
   * @param {import("express").Response} res
   * @returns {Promise<void>} Responde com JSON e status HTTP apropriado.
   */
  async handle(req, res) {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ message: "Usuário não autenticado." });
    }

    try {
      const result = await syncUserSubscriptions(userId);
      return res.status(200).json(result);
    } catch (error) {
      console.error("Erro ao sincronizar assinaturas:", error.message);
      return res
        .status(500)
        .json({ message: "Não foi possível sincronizar a assinatura." });
    }
  }
}
