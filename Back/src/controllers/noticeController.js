import { AppDataSource } from "../../data-source.js";
import { NoticeEntity } from "../entities/Notice.js";
import { UserEntity } from "../entities/User.js";
import { classifyNotice, matchScore } from "../services/themeClassifier.js";

// Preenche os temas de editais novos ou reimportados (themes = NULL).
// Nunca sobrescreve temas já definidos (automáticos ou manuais do admin).
async function ensureThemes(noticeRepo, notices) {
    const pending = notices.filter((notice) => notice.themes === null || notice.themes === undefined);
    if (pending.length === 0) return;
    for (const notice of pending) {
        notice.themes = classifyNotice(notice.title, notice.description);
    }
    await noticeRepo.save(pending);
}

export class NoticeController {
    async getAllNotices(req, res) {
        try {
            const noticeRepo = AppDataSource.getRepository(NoticeEntity);

            const userRepo = AppDataSource.getRepository(UserEntity);
            const { userId } = req.params;
            const user = await userRepo.findOne({ where: { id: userId } });
            const notices = await noticeRepo.find({
                order: { id: "DESC" }
                });

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
