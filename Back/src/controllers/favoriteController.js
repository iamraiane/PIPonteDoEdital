import { AppDataSource } from "../../data-source.js";
import { FavoriteEntity } from "../entities/Favorite.js";

/**
 * Controller de favoritos: permite ao usuário autenticado favoritar,
 * desfavoritar e listar editais (notices) salvos.
 * Rotas protegidas: perfis "premium" e "admin" (via checkRole).
 */
export class FavoriteController {

    /**
     * Adiciona um edital aos favoritos do usuário autenticado.
     * Recusa (400) se o edital já estiver favoritado pelo mesmo usuário.
     * @param {import("express").Request} req
     * @param {import("express").Response} res
     * @returns {Promise<void>} Responde com JSON e status HTTP apropriado (201 com o favorito, 400 se já favoritado ou 500 em erro interno).
     */
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

    /**
     * Remove o favorito do usuário autenticado para o edital informado em :notice_id.
     * @param {import("express").Request} req
     * @param {import("express").Response} res
     * @returns {Promise<void>} Responde com JSON e status HTTP apropriado (200 com confirmação, 404 se não favoritado ou 500 em erro interno).
     */
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

    /**
     * Lista todos os favoritos do usuário autenticado, com os editais relacionados.
     * @param {import("express").Request} req
     * @param {import("express").Response} res
     * @returns {Promise<void>} Responde com JSON e status HTTP apropriado (200 com o array de favoritos ou 500 em erro interno).
     */
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