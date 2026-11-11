import { AppDataSource } from "../../data-source.js";
import { DoubtEntity } from "../entities/Doubt.js";
import { DoubtAnswerEntity } from "../entities/DoubtAnswer.js";

/** Limite total de caracteres aceitos no conteúdo de uma dúvida (assunto + quebra de linha + descrição). */
const DOUBT_CONTENT_MAX = 562; // assunto (60) + "\n\n" (2) + descricao (500)

/**
 * Reduz um usuário aos dados públicos seguros para exposição (id e nome).
 * @param {{ id: number|string, name: string } | null | undefined} user - Usuário relacionado à dúvida.
 * @returns {{ id: number|string, name: string } | null} Objeto reduzido ou null quando não há usuário.
 */
function publicUser(user) {
    if (!user) return null;
    return { id: user.id, name: user.name };
}

/**
 * Serializa uma dúvida trocando o objeto completo do autor pelos dados públicos.
 * @param {object} doubt - Dúvida retornada pelo banco (com a relação "user" carregada).
 * @returns {object} Cópia da dúvida com user reduzido aos dados públicos.
 */
function serializeDoubt(doubt) {
    return { ...doubt, user: publicUser(doubt.user) };
}

/**
 * Indica se o usuário autenticado pode alterar ou excluir a dúvida.
 * Regra: apenas o dono da dúvida (user_id) ou um usuário com perfil "admin".
 * @param {import("express").Request} req - Requisição com req.user autenticado.
 * @param {object} doubt - Dúvida alvo da operação.
 * @returns {boolean} true se for o dono ou admin; false caso contrário.
 */
function canModify(req, doubt) {
    return req.user.id === doubt.user_id || req.user.role === "admin";
}

/**
 * Controller de dúvidas dos usuários: criação, listagem, consulta,
 * atualização e remoção, com validação de tamanho e permissão de edição.
 */
export class DoubtController {

    /**
     * Cria uma dúvida para o usuário autenticado.
     * Valida o limite de 562 caracteres (assunto até 60 e descrição até 500).
     * @param {import("express").Request} req
     * @param {import("express").Response} res
     * @returns {Promise<void>} Responde com JSON e status HTTP apropriado (201 com a dúvida, 400 se exceder o limite ou 500 em erro interno).
     */
    async createDoubt(req, res) {
        const repo = AppDataSource.getRepository(DoubtEntity);
        
        const { content, status } = req.body;
        const userId = req.user.id; // Supondo que o ID do usuário esteja disponível em req.user

        if (typeof content === "string" && content.length > DOUBT_CONTENT_MAX) {
            return res.status(400).json({ message: "A dúvida deve ter no máximo 562 caracteres (assunto até 60 e descrição até 500)" });
        }

        try {
            const doubt = repo.create({
                content,
                status,
                user_id: userId
            });

            await repo.save(doubt);

            return res.status(201).json(doubt);
        } catch (error) {
            console.error(error);
            return res.status(500).json({ message: "Internal server error" });
        }
    }

    /**
     * Lista todas as dúvidas com autor e respostas associadas,
     * expondo apenas os dados públicos do usuário.
     * @param {import("express").Request} req
     * @param {import("express").Response} res
     * @returns {Promise<void>} Responde com JSON e status HTTP apropriado (200 com o array de dúvidas ou 500 em erro interno).
     */
    async getAllDoubts(req, res) {
        const repo = AppDataSource.getRepository(DoubtEntity);

        try {
            const doubts = await repo.find({ relations: ["user", "answers"] });
            return res.json(doubts.map(serializeDoubt));
        } catch (error) {
            console.error(error);
            return res.status(500).json({ message: "Internal server error" });
        }
    }


    /**
     * Busca uma dúvida pelo id, carregando autor e respostas,
     * com os dados públicos do usuário na resposta.
     * @param {import("express").Request} req
     * @param {import("express").Response} res
     * @returns {Promise<void>} Responde com JSON e status HTTP apropriado (200 com a dúvida, 404 se não encontrada ou 500 em erro interno).
     */
    async getDoubtById(req, res) {
        const repo = AppDataSource.getRepository(DoubtEntity);

        const { id } = req.params;

        try {
            const doubt = await repo.findOne({
                where: { id: parseInt(id) },
                relations: ["user", "answers"]
            });

            if (!doubt) {
                return res.status(404).json({ message: "Doubt not found" });
            }

            return res.json(serializeDoubt(doubt));
        } catch (error) {
            console.error(error);
            return res.status(500).json({ message: "Internal server error" });
        }
    }
    /**
     * Atualiza a dúvida apenas se o usuário for dono ou admin (403 caso contrário).
     * O campo status só pode ser alterado por admin; conteúdo respeita o limite de 562 caracteres.
     * @param {import("express").Request} req
     * @param {import("express").Response} res
     * @returns {Promise<void>} Responde com JSON e status HTTP apropriado (200 com a dúvida, 400 se exceder o limite, 404 se não encontrada, 403 sem permissão ou 500 em erro interno).
     */
    async updateDoubt(req, res) {
        const repo = AppDataSource.getRepository(DoubtEntity);

        const { id } = req.params;
        const { content, status } = req.body;

        if (typeof content === "string" && content.length > DOUBT_CONTENT_MAX) {
            return res.status(400).json({ message: "A dúvida deve ter no máximo 562 caracteres (assunto até 60 e descrição até 500)" });
        }

        try {
            const doubtToUpdate = await repo.findOneBy({ id: parseInt(id) });

            if (!doubtToUpdate) {
                return res.status(404).json({ message: "Doubt not found" });
            }

            if (!canModify(req, doubtToUpdate)) {
                return res.status(403).json({ message: "Acesso negado!" });
            }

            if (content) doubtToUpdate.content = content;
            if (status && req.user.role === "admin") doubtToUpdate.status = status;

            await repo.save(doubtToUpdate);

            return res.json(doubtToUpdate);
        } catch (error) {
            console.error(error);
            return res.status(500).json({ message: "Internal server error" });
        }
    }

    /**
     * Exclui a dúvida apenas se o usuário for dono ou admin (403 caso contrário),
     * removendo antes todas as respostas vinculadas a ela.
     * @param {import("express").Request} req
     * @param {import("express").Response} res
     * @returns {Promise<void>} Responde com JSON e status HTTP apropriado (200 com confirmação, 404 se não encontrada, 403 sem permissão ou 500 em erro interno).
     */
    async deleteDoubt(req, res) {
        const repo = AppDataSource.getRepository(DoubtEntity);

        const { id } = req.params;

        try {
            const doubtToDelete = await repo.findOneBy({ id: parseInt(id) });

            if (!doubtToDelete) {
                return res.status(404).json({ message: "Doubt not found" });
            }

            if (!canModify(req, doubtToDelete)) {
                return res.status(403).json({ message: "Acesso negado!" });
            }

            const answerRepo = AppDataSource.getRepository(DoubtAnswerEntity);
            await answerRepo.delete({ doubt_id: doubtToDelete.id });

            await repo.remove(doubtToDelete);

            return res.json({ message: "Doubt deleted" });
        } catch (error) {
            console.error(error);
            return res.status(500).json({ message: "Internal server error" });
        }
    }}