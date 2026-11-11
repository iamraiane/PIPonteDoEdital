import { AppDataSource } from "../../data-source.js";
import { DoubtEntity } from "../entities/Doubt.js";

const DOUBT_CONTENT_MAX = 562; // assunto (60) + "\n\n" (2) + descricao (500)

function publicUser(user) {
    if (!user) return null;
    return { id: user.id, name: user.name };
}

function serializeDoubt(doubt) {
    return { ...doubt, user: publicUser(doubt.user) };
}

function canModify(req, doubt) {
    return req.user.id === doubt.user_id || req.user.role === "admin";
}

export class DoubtController {

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
            if (status) doubtToUpdate.status = status;

            await repo.save(doubtToUpdate);

            return res.json(doubtToUpdate);
        } catch (error) {
            console.error(error);
            return res.status(500).json({ message: "Internal server error" });
        }
    }

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

            await repo.remove(doubtToDelete);

            return res.json({ message: "Doubt deleted" });
        } catch (error) {
            console.error(error);
            return res.status(500).json({ message: "Internal server error" });
        }
    }}