import {SearchController} from '../controllers/searchController.js';
import express from 'express';
import { authMiddleware } from '../utils/auth.js';
import { checkRole } from '../middlewares/checkRoles.js';

const searchRouter = express.Router();
const searchController = new SearchController();

searchRouter.get('/search/:userId', authMiddleware, checkRole("premium", "admin"), searchController.searchNotices);

export default searchRouter;