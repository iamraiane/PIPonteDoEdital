import { AppDataSource } from "../../data-source.js";
import { NoticeEntity } from "../entities/Notice.js";
import { UserEntity } from "../entities/User.js";
import { classifyNotice, matchScore } from "../services/themeClassifier.js";

/**
 * Garante que editais novos ou reimportados tenham seus temas classificados.
 * Preenche apenas os editais com themes NULL/undefined e nunca sobrescreve
 * temas já definidos (automáticos ou manuais do admin).
 * @param {import("typeorm").Repository<NoticeEntity>} noticeRepo - Repositório de editais usado para salvar.
 * @param {NoticeEntity[]} notices - Editais a verificar; somente os sem temas são alterados.
 * @returns {Promise<void>} Persiste os temas preenchidos no banco (sem retorno em caso de nada pendente).
 */
async function ensureThemes(noticeRepo, notices) {
    const pending = notices.filter((notice) => notice.themes === null || notice.themes === undefined);
    if (pending.length === 0) return;
    for (const notice of pending) {
        notice.themes = classifyNotice(notice.title, notice.description);
    }
    await noticeRepo.save(pending);
}

/**
 * Controller de editais (notices): listagem com recomendação por afinidade
 * às preferências do usuário, consulta por id/área e atualização/remoção (admin).
 */
export class NoticeController {
    /**
     * Lista os editais ordenados por afinidade com as preferências do usuário
     * (recomendados primeiro), classificando temas pendentes antes de responder.
     * Editais com prazo vencido (COALESCE de deadline_date/publication_date
     * anterior a hoje, fuso America/Sao_Paulo) são excluídos; os sem data
     * permanecem. Usuários com perfil "user" recebem no máximo 5 editais.
     * @param {import("express").Request} req
     * @param {import("express").Response} res
     * @returns {Promise<void>} Responde com JSON e status HTTP apropriado (200 com o array de editais, 404 se o usuário não existir ou 500 em erro interno).
     */
    async getAllNotices(req, res) {
        try {
            const noticeRepo = AppDataSource.getRepository(NoticeEntity);

            const userRepo = AppDataSource.getRepository(UserEntity);
            const { userId } = req.params;
            const user = await userRepo.findOne({ where: { id: userId } });
            const today = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo" }).format(new Date());
            const notices = await noticeRepo.createQueryBuilder("notice")
                .where(
                    "COALESCE(notice.deadline_date, notice.publication_date) IS NULL OR COALESCE(notice.deadline_date, notice.publication_date) >= :today",
                    { today }
                )
                .orderBy("notice.id", "DESC")
                .getMany();

            if (!user) {
                return res.status(404).json({ message: "User not found" });
            }

            await ensureThemes(noticeRepo, notices);

            // Ordena por afinidade com as preferências do usuário (recomendados primeiro).
            const preferences = Array.isArray(user.preferences) ? user.preferences : [];
            const ranked = notices
                .map((notice) => ({ notice, score: matchScore(notice.themes, preferences) }))
                .sort((a, b) => b.score - a.score || b.notice.id - a.notice.id)
                .map((entry) => entry.notice);

            const userRole = user.role;

            if (userRole === "user" && ranked.length > 5) {
                const limitedNotices = ranked.slice(0, 5);
                return res.json(limitedNotices);
            } else {
                return res.json(ranked);
            }

        } catch (error) {
            console.error(error);
            return res.status(500).json({ message: "Internal server error" });
        }
    }

    /**
     * Busca um edital pelo id, classificando os temas caso ainda não existam.
     * @param {import("express").Request} req
     * @param {import("express").Response} res
     * @returns {Promise<void>} Responde com JSON e status HTTP apropriado (200 com o edital, 404 se não encontrado ou 500 em erro interno).
     */
    async getNoticeById(req, res) {
        try {
            const noticeRepo = AppDataSource.getRepository(NoticeEntity);
            const { id } = req.params;
            const notice = await noticeRepo.findOne({ where: { id: parseInt(id) } });

            if (!notice) {
                return res.status(404).json({ message: "Notice not found" });
            }

            await ensureThemes(noticeRepo, [notice]);

            return res.json(notice);
        } catch (error) {
            console.error(error);
            return res.status(500).json({ message: "Internal server error" });
        }
    }

    /**
     * Lista os editais vinculados a uma área (área de conhecimento) específica.
     * @param {import("express").Request} req
     * @param {import("express").Response} res
     * @returns {Promise<void>} Responde com JSON e status HTTP apropriado (200 com o array, 404 se a área não tiver editais ou 500 em erro interno).
     */
    async getNoticesByArea(req, res) {
        try {
            const noticeRepo = AppDataSource.getRepository(NoticeEntity);
            const { areaId } = req.params;
            const notices = await noticeRepo.find({ where: { area_id: parseInt(areaId) } });

            if (!notices || notices.length === 0) {
                return res.status(404).json({ message: "No notices found for this area" });
            }

            return res.json(notices);
        } catch (error) {
            console.error(error);
            return res.status(500).json({ message: "Internal server error" });
        }
    }
    /**
     * Atualiza os campos de um edital.
     * Temas enviados como array têm prioridade (definição manual do admin);
     * caso contrário, os temas são re-classificados automaticamente quando
     * título ou descrição mudam. Rota protegida: apenas o perfil admin.
     * @param {import("express").Request} req
     * @param {import("express").Response} res
     * @returns {Promise<void>} Responde com JSON e status HTTP apropriado (200 com o edital, 404 se não encontrado ou 500 em erro interno).
     */
    async updateNotice(req, res) {
        try {
            const noticeRepo = AppDataSource.getRepository(NoticeEntity);
            const { id } = req.params;
            const { title, state_code, description, state, link, publication_date, deadline_date, themes } = req.body;
            const notice = await noticeRepo.findOne({ where: { id: parseInt(id) } });

            if (!notice) {
                return res.status(404).json({ message: "Notice not found" });
            }

            const textChanged =
                (title !== undefined && title !== notice.title) ||
                (description !== undefined && description !== notice.description);

            if (title) notice.title = title;
            if (state_code) notice.state_code = state_code;
            if (description !== undefined) notice.description = description;
            if (state) notice.state = state;
            if (link) notice.link = link;
            if (publication_date) notice.publication_date = publication_date;
            if (deadline_date !== undefined) notice.deadline_date = deadline_date || null;

            if (Array.isArray(themes)) {
                // Tema definido manualmente (admin) tem prioridade.
                notice.themes = themes;
            } else if (textChanged) {
                // Re-classifica automaticamente quando título/descrição mudam.
                notice.themes = classifyNotice(notice.title, notice.description);
            }

            await noticeRepo.save(notice);
            return res.json(notice);
        } catch (error) {
            console.error(error);
            return res.status(500).json({ message: "Internal server error" });
        }
    }
    /**
     * Exclui um edital pelo id.
     * Rota protegida: apenas o perfil admin (via checkRole).
     * @param {import("express").Request} req
     * @param {import("express").Response} res
     * @returns {Promise<void>} Responde com JSON e status HTTP apropriado (200 com confirmação, 404 se não encontrado ou 500 em erro interno).
     */
    async deleteNotice(req, res) {
        try {
            const noticeRepo = AppDataSource.getRepository(NoticeEntity);
            const { id } = req.params;
            const notice = await noticeRepo.findOne({ where: { id: parseInt(id) } });

            if (!notice) {
                return res.status(404).json({ message: "Notice not found" });
            }

            await noticeRepo.remove(notice);
            return res.json({ message: "Notice deleted successfully" });
        } catch (error) {
            console.error(error);
            return res.status(500).json({ message: "Internal server error" });
        }
    }
}
