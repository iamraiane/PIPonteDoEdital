import { syncUserSubscriptions } from "../services/subscriptionSyncService.js";

export class SubscriptionSyncController {
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
