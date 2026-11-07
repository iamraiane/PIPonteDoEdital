import { cancelUserSubscription } from "../services/subscriptionSyncService.js";

export class SubscriptionCancelController {
  async handle(req, res) {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ message: "Usuário não autenticado." });
    }

    const subscriptionId = Number(req.params.id);

    if (!Number.isInteger(subscriptionId) || subscriptionId <= 0) {
      return res.status(400).json({ message: "ID da assinatura inválido." });
    }

    try {
      const result = await cancelUserSubscription(userId, subscriptionId);
      return res.status(200).json(result);
    } catch (error) {
      if (error.code === "NOT_FOUND") {
        return res.status(404).json({ message: error.message });
      }

      if (error.code === "NO_MP_ID") {
        return res.status(400).json({ message: error.message });
      }

      console.error("Erro ao cancelar assinatura:", error.message);
      return res
        .status(500)
        .json({ message: "Não foi possível cancelar a assinatura." });
    }
  }
}
