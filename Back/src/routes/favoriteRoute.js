/**
 * Declara os endpoints do módulo de favoritos (/favorites): adicionar,
 * remover e listar os editais favoritados pelo usuário.
 * Autenticação: todas as rotas exigem authMiddleware + checkRole("premium", "admin")
 * — favoritar é exclusivo de usuários premium/administradores.
 * Mount point: raiz da aplicação.
 */
import { FavoriteController } from "../controllers/favoriteController.js";
import express from "express";
import { authMiddleware } from "../utils/auth.js";
import { checkRole } from "../middlewares/checkRoles.js";

const favoriteController = new FavoriteController();
const favoriteRouter = express.Router();

favoriteRouter.post("/favorites/:notice_id", authMiddleware, checkRole("premium", "admin"), favoriteController.addFavorite);
favoriteRouter.delete("/favorites/:notice_id", authMiddleware, checkRole("premium", "admin"), favoriteController.removeFavorite);
favoriteRouter.get("/favorites", authMiddleware, checkRole("premium", "admin"), favoriteController.getUserFavorites);

export default favoriteRouter;