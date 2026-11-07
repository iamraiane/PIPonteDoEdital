import { AppDataSource } from "../../data-source.js";
import { DoubtEntity } from "../entities/Doubt.js";

export class DoubtController {

    async createDoubt(req, res) {
        const repo = AppDataSource.getRepository(DoubtEntity);
        
        const { content, status } = req.body;
        const userId = req.user.id; // Supondo que o ID do usuário esteja disponível em req.user

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
            return res.json(doubts);
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

            return res.json(doubt);
        } catch (error) {
            console.error(error);
            return res.status(500).json({ message: "Internal server error" });
        }
    }
    async updateDoubt(req, res) {
        const repo = AppDataSource.getRepository(DoubtEntity);

        const { id } = req.params;
        const { content, status } = req.body;

        try {
            const doubtToUpdate = await repo.findOneBy({ id: parseInt(id) });

            if (!doubtToUpdate) {
                return res.status(404).json({ message: "Doubt not found" });
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

            await repo.remove(doubtToDelete);

            return res.json({ message: "Doubt deleted" });
        } catch (error) {
            console.error(error);
            return res.status(500).json({ message: "Internal server error" });
        }
    }}