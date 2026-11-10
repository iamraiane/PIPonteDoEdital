import { AppDataSource } from "../../data-source.js";
import { UserEntity } from "../entities/User.js"; // copie o import que o userController já usa
import { NOTIFICATION_OPTIONS } from "../utils/notificationOptions.js";

class NotificationController {
    async getPreferences(req, res) {
        try {
            const user = await AppDataSource.getRepository(UserEntity).findOne({
                where: { id: req.user.id },
            });

            if (!user) {
                return res.status(404).json({ message: "Usuário não encontrado" });
            }

            const selected =
                user.notification_days === null || user.notification_days === undefined
                    ? NOTIFICATION_OPTIONS
                    : user.notification_days.map(Number);

            return res.status(200).json({ options: NOTIFICATION_OPTIONS, selected });
        } catch (error) {
            console.error(error);
            return res.status(500).json({ message: "Erro interno no servidor" });
        }
    }

    async updatePreferences(req, res) {
        try {
            const { days } = req.body;

            if (!Array.isArray(days)) {
                return res.status(400).json({ message: "Envie uma lista de dias" });
            }

            const parsed = [...new Set(days.map(Number))];

            if (parsed.some((d) => !NOTIFICATION_OPTIONS.includes(d))) {
                return res.status(400).json({ message: "Opção de notificação inválida" });
            }

            await AppDataSource.getRepository(UserEntity).update(
                { id: req.user.id },
                { notification_days: parsed }
            );

            return res.status(200).json({ message: "Preferências atualizadas", selected: parsed });
        } catch (error) {
            console.error(error);
            return res.status(500).json({ message: "Erro interno no servidor" });
        }
    }
}

export default new NotificationController();