import { DoubtController } from "../controllers/doubtController.js";
import express from "express";
import { authMiddleware } from "../utils/auth.js";

const doubtController = new DoubtController();
const doubtRouter = express.Router();

doubtRouter.post("/doubts", authMiddleware, doubtController.createDoubt);
doubtRouter.get("/doubts", doubtController.getAllDoubts);
doubtRouter.get("/doubts/:id", doubtController.getDoubtById);
doubtRouter.put("/doubts/:id", authMiddleware, doubtController.updateDoubt);
doubtRouter.delete("/doubts/:id", authMiddleware, doubtController.deleteDoubt);


export default doubtRouter;