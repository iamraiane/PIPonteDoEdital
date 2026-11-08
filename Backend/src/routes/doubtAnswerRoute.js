import { DoubtAnswerController } from "../controllers/doubtAnswerController.js";
import express from "express";
import { authMiddleware } from "../utils/auth.js";
import {checkRole} from "../middlewares/checkRoles.js";

const doubtAnswerController = new DoubtAnswerController();
const doubtAnswerRouter = express.Router();

doubtAnswerRouter.post("/doubts/:doubt_id/answers", authMiddleware, checkRole('admin'), doubtAnswerController.createDoubtAnswer);
doubtAnswerRouter.get("/doubts/:doubt_id/answers", doubtAnswerController.getAllDoubtAnswers);
doubtAnswerRouter.get("/doubts/:doubt_id/answers/:id", doubtAnswerController.getDoubtAnswerById);
doubtAnswerRouter.delete("/doubts/:doubt_id/answers/:id", authMiddleware, checkRole('admin'), doubtAnswerController.deleteDoubtAnswer);
doubtAnswerRouter.put("/doubts/:doubt_id/answers/:id", authMiddleware, checkRole('admin'), doubtAnswerController.updateDoubtAnswer);

export default doubtAnswerRouter;