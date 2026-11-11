import { AppDataSource } from "../../data-source.js";
import { DoubtAnswerEntity } from "../entities/DoubtAnswer.js";

/** Limite máximo de caracteres aceitos no conteúdo de uma resposta à dúvida. */
const ANSWER_CONTENT_MAX = 1000;

/**
 * Controller de respostas a dúvidas: criação, listagem, consulta,
 * atualização e remoção, com validação de tamanho do conteúdo.
 */
export class DoubtAnswerController {

    /**
     * Cria uma resposta para a dúvida indicada em :doubt_id, registrando o autor
     * como o usuário autenticado. Valida o limite de 1000 caracteres.
     * Rota protegida: apenas o perfil admin (via checkRole).
     * @param {import("express").Request} req
     * @param {import("express").Response} res
     * @returns {Promise<void>} Responde com JSON e status HTTP apropriado (201 com a resposta, 400 se exceder o limite ou 500 em erro interno).
     */
    async createDoubtAnswer(req, res) {
        const repo = AppDataSource.getRepository(DoubtAnswerEntity);

                const { doubt_id } = req.params;
        const { content } = req.body;
        const userId = req.user.id;

        if (typeof content === "string" && content.length > ANSWER_CONTENT_MAX) {
            return res.status(400).json({ message: "A resposta deve ter no máximo 1000 caracteres" });
        }

        try {
            const doubtAnswer = repo.create({
                content,
                doubt_id: parseInt(doubt_id),
                answered_by: userId
            });

            await repo.save(doubtAnswer);

            return res.status(201).json(doubtAnswer);
        } catch (error) {
            console.error(error);
            return res.status(500).json({ message: "Internal server error" });
        }
    }

    /**
     * Busca uma resposta à dúvida pelo id, carregando a dúvida e o autor.
     * @param {import("express").Request} req
     * @param {import("express").Response} res
     * @returns {Promise<void>} Responde com JSON e status HTTP apropriado (200 com a resposta, 404 se não encontrada ou 500 em erro interno).
     */
    async getDoubtAnswerById(req, res) {
        const repo = AppDataSource.getRepository(DoubtAnswerEntity);

        const { id } = req.params;

        try {
            const doubtAnswer = await repo.findOne({
                where: { id: parseInt(id) },
                relations: ["doubt", "user"]
            });

            if (!doubtAnswer) {
                return res.status(404).json({ message: "Doubt answer not found" });
            }

            return res.json(doubtAnswer);
        } catch (error) {
            console.error(error);
            return res.status(500).json({ message: "Internal server error" });
        }
    }
    /**
     * Lista todas as respostas a dúvidas, carregando a dúvida e o autor de cada uma.
     * @param {import("express").Request} req
     * @param {import("express").Response} res
     * @returns {Promise<void>} Responde com JSON e status HTTP apropriado (200 com o array de respostas ou 500 em erro interno).
     */
    async getAllDoubtAnswers(req, res) {
        const repo = AppDataSource.getRepository(DoubtAnswerEntity);

        try {
            const doubtAnswers = await repo.find({ relations: ["doubt", "user"] });
            return res.json(doubtAnswers);
        } catch (error) {
            console.error(error);
            return res.status(500).json({ message: "Internal server error" });
        }
    }
    /**
     * Exclui uma resposta à dúvida pelo id.
     * Rota protegida: apenas o perfil admin (via checkRole).
     * @param {import("express").Request} req
     * @param {import("express").Response} res
     * @returns {Promise<void>} Responde com JSON e status HTTP apropriado (200 com confirmação, 404 se não encontrada ou 500 em erro interno).
     */
    async deleteDoubtAnswer(req, res) {
        const repo = AppDataSource.getRepository(DoubtAnswerEntity);

        const { id } = req.params;

        try {
            const doubtAnswer = await repo.findOneBy({ id: parseInt(id) });

            if (!doubtAnswer) {
                return res.status(404).json({ message: "Doubt answer not found" });
            }

            await repo.remove(doubtAnswer);

            return res.json({ message: "Doubt answer deleted" });
        } catch (error) {
            console.error(error);
            return res.status(500).json({ message: "Internal server error" });
        }
    }
    /**
     * Atualiza o conteúdo de uma resposta à dúvida, respeitando o limite de 1000 caracteres.
     * Rota protegida: apenas o perfil admin (via checkRole).
     * @param {import("express").Request} req
     * @param {import("express").Response} res
     * @returns {Promise<void>} Responde com JSON e status HTTP apropriado (200 com a resposta, 400 se exceder o limite, 404 se não encontrada ou 500 em erro interno).
     */
    async updateDoubtAnswer(req, res) {
        const repo = AppDataSource.getRepository(DoubtAnswerEntity);
        const { id } = req.params;
        const { content } = req.body;

        if (typeof content === "string" && content.length > ANSWER_CONTENT_MAX) {
            return res.status(400).json({ message: "A resposta deve ter no máximo 1000 caracteres" });
        }

        try {
            const doubtAnswerToUpdate = await repo.findOneBy({ id: parseInt(id) });

            if (!doubtAnswerToUpdate) {
                return res.status(404).json({ message: "Doubt answer not found" });
            }

            if (content) doubtAnswerToUpdate.content = content;

            await repo.save(doubtAnswerToUpdate);

            return res.json(doubtAnswerToUpdate);
        } catch (error) {
            console.error(error);
            return res.status(500).json({ message: "Internal server error" });
        }
    }
}