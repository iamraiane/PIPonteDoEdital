/**
 * Declara os endpoints do módulo de notícias/editais (montado em "/notices"):
 * listagem por usuário, por área, consulta por id, atualização e remoção.
 * Autenticação: as três rotas de leitura são públicas; atualizar e remover
 * exigem authMiddleware + checkRole("admin").
 */
import { Router } from "express";
import { NoticeController } from "../controllers/noticeController.js";
import { checkRole } from "../middlewares/checkRoles.js";
import { authMiddleware } from "../utils/auth.js";

const router = Router();
const noticeController = new NoticeController();

router.get("/user/:userId", noticeController.getAllNotices);
router.get("/area/:areaId", noticeController.getNoticesByArea);
router.get("/:id", noticeController.getNoticeById);
router.put("/:id", authMiddleware, checkRole("admin"), noticeController.updateNotice);
router.delete("/:id", authMiddleware, checkRole("admin"), noticeController.deleteNotice);

router.post("/scraper/run", authMiddleware, checkRole("admin"), async (req, res) => {
    try {
        const resposta = await fetch(`${process.env.SCRAPER_API_URL}/scrape`, {
            method: "POST",
            headers: { "x-api-key": process.env.SCRAPER_API_KEY },
        });

        const dados = await resposta.json();
        return res.status(resposta.status).json(dados);
    } catch (erro) {
        console.error(erro);
        return res.status(502).json({ message: "Scraper indisponível." });
    }
});

export default router;