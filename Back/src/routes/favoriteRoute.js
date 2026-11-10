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