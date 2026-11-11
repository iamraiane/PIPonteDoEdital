import { AppDataSource } from "../../data-source.js";
import { NoticeEntity } from "../entities/Notice.js";
import { UserEntity } from "../entities/User.js";

/**
 * Controller de busca de editais por título, restrito a perfis acima de "user".
 */
export class SearchController {
    /**
     * Busca editais cujo título contenha o termo informado em ?search=.
     * Exige usuário existente (404) e nega acesso ao perfil "user" (403);
     * a rota também restringe a "premium" e "admin" via checkRole.
     * @param {import("express").Request} req
     * @param {import("express").Response} res
     * @returns {Promise<void>} Responde com JSON e status HTTP apropriado (200 com os editais, 404 se o usuário não existir, 403 sem permissão ou 500 em erro interno).
     */
    async searchNotices(req, res) {
        try {
            const { userId } = req.params;
            const { search } = req.query;
            
            const userRepo = AppDataSource.getRepository(UserEntity);
            const user = await userRepo.findOne({ where: { id: userId } });

            if (!user) {
                return res.status(404).json({ message: "User not found" });
            }

            if (user.role === "user") {
                return res.status(403).json({ message: "Acesso negado, esse usuario não tem permissão para essa ação." });
            }

            const noticeRepo = AppDataSource.getRepository(NoticeEntity);
            const notices = await noticeRepo
                .createQueryBuilder("notice")
                .where("notice.title LIKE :search", { search: `%${search}%` })
                .getMany();

            return res.json(notices);
        } catch (error) {
            console.error(error);
            return res.status(500).json({ message: "Internal server error" });
        }
    }
}