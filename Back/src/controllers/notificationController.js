import { AppDataSource } from "../../data-source.js";
import { NotificationEntity } from "../entities/Notification.js";
import { runFavoriteNotifications } from "../jobs/notifyFavorites.js";

/**
 * Controller de notificações in-app: execução manual do job de notificações
 * de favoritos e gestão das notificações do usuário (listagem e leitura).
 */
class NotificationController {
    /**
     * Dispara manualmente o job que envia notificações de favoritos
     * (editais salvos com prazo próximo). Rota protegida: apenas o perfil admin.
     * @param {import("express").Request} req
     * @param {import("express").Response} res
     * @returns {Promise<void>} Responde com JSON e status HTTP apropriado (200 em sucesso ou 500 se o job falhar).
     */
    async runNow(req, res) {
        try {
            console.log(`Job de notificações disparado manualmente por ${req.user.email}`);
            await runFavoriteNotifications();
            return res.status(200).json({ message: "Job de notificações executado com sucesso" });
        } catch (error) {
            console.error("Erro ao executar job de notificações manualmente:", error);
            return res.status(500).json({ message: "Erro ao executar o job de notificações" });
        }
    }

    /**
     * Lista até as 50 notificações mais recentes do usuário autenticado,
     * com o edital relacionado e em ordem decrescente de criação.
     * @param {import("express").Request} req
     * @param {import("express").Response} res
     * @returns {Promise<void>} Responde com JSON e status HTTP apropriado (200 com o array ou 500 em erro interno).
     */
    async list(req, res) {
        try {
            const notifications = await AppDataSource.getRepository(NotificationEntity).find({
                where: { user_id: req.user.id },
                relations: ["notice"],
                order: { created_at: "DESC" },
                take: 50,
            });

            return res.status(200).json(notifications);
        } catch (error) {
            console.error(error);
            return res.status(500).json({ message: "Erro interno no servidor" });
        }
    }

    /**
     * Marca uma notificação como lida; só age se a notificação pertencer
     * ao usuário autenticado (404 caso contrário) e ainda não esteja lida.
     * @param {import("express").Request} req
     * @param {import("express").Response} res
     * @returns {Promise<void>} Responde com JSON e status HTTP apropriado (200 com a notificação, 404 se não encontrada ou 500 em erro interno).
     */
    async markRead(req, res) {
        try {
            const notification = await AppDataSource.getRepository(NotificationEntity).findOne({
                where: { id: parseInt(req.params.id, 10), user_id: req.user.id },
            });

            if (!notification) {
                return res.status(404).json({ message: "Notificação não encontrada" });
            }

            if (!notification.is_read) {
                notification.is_read = true;
                await AppDataSource.getRepository(NotificationEntity).save(notification);
            }

            return res.status(200).json({ message: "Notificação marcada como lida", notification });
        } catch (error) {
            console.error(error);
            return res.status(500).json({ message: "Erro interno no servidor" });
        }
    }

    /**
     * Marca todas as notificações não lidas do usuário autenticado como lidas.
     * @param {import("express").Request} req
     * @param {import("express").Response} res
     * @returns {Promise<void>} Responde com JSON e status HTTP apropriado (200 com confirmação ou 500 em erro interno).
     */
    async markAllRead(req, res) {
        try {
            await AppDataSource.getRepository(NotificationEntity).update(
                { user_id: req.user.id, is_read: false },
                { is_read: true }
            );

            return res.status(200).json({ message: "Todas as notificações foram marcadas como lidas" });
        } catch (error) {
            console.error(error);
            return res.status(500).json({ message: "Erro interno no servidor" });
        }
    }
}

export default new NotificationController();
