import { AppDataSource } from "../../data-source.js";
import { FavoriteEntity } from "../entities/Favorite.js";

export class FavoriteController {

    async addFavorite(req, res) {
        try {
            const favoriteRepo = AppDataSource.getRepository(FavoriteEntity);

            const { notice_id } = req.params;
            const user_id = req.user.id;

            const alreadyFavorited = await favoriteRepo.findOne({
                where: { user_id, notice_id: parseInt(notice_id) },
            });

            if (alreadyFavorited) {
                return res.status(400).json({ message: "Notice already favorited" });
            }

            const favorite = favoriteRepo.create({
                user_id,
                notice_id: parseInt(notice_id),
            });

            await favoriteRepo.save(favorite);

            return res.status(201).json(favorite);
        } catch (error) {
            console.error(error);
            return res.status(500).json({ message: "Internal server error" });
        }
    }

    async removeFavorite(req, res) {
        try {
            const favoriteRepo = AppDataSource.getRepository(FavoriteEntity);

            const { notice_id } = req.params;
            const user_id = req.user.id;

            const favorite = await favoriteRepo.findOne({
                where: { user_id, notice_id: parseInt(notice_id) },
            });

            if (!favorite) {
                return res.status(404).json({ message: "Favorite not found" });
            }

            await favoriteRepo.remove(favorite);

            return res.status(200).json({ message: "Favorite removed successfully" });
        } catch (error) {
            console.error(error);
            return res.status(500).json({ message: "Internal server error" });
        }
    }

    async getUserFavorites(req, res) {
        try {
            const favoriteRepo = AppDataSource.getRepository(FavoriteEntity);

            const user_id = req.user.id;

            const favorites = await favoriteRepo.find({
                where: { user_id },
                relations: ["notice"],
            });

            return res.json(favorites);
        } catch (error) {
            console.error(error);
            return res.status(500).json({ message: "Internal server error" });
        }
    }
}