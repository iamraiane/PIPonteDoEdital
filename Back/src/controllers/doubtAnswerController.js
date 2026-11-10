import { AppDataSource } from "../../data-source.js";
import { DoubtAnswerEntity } from "../entities/DoubtAnswer.js";

export class DoubtAnswerController {

    async createDoubtAnswer(req, res) {
        const repo = AppDataSource.getRepository(DoubtAnswerEntity);

                const { doubt_id } = req.params;
        const { content } = req.body;
        const userId = req.user.id;

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
    async updateDoubtAnswer(req, res) {
        const repo = AppDataSource.getRepository(DoubtAnswerEntity);
        const { id } = req.params;
        const { content } = req.body;

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