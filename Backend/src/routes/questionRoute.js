// import { QuestionController } from "../controllers/questionController.js";
// import express from "express";
// import { authMiddleware } from "../utils/auth.js";
// import { checkRole } from "../middlewares/checkRoles.js";

// const questionController = new QuestionController();
// const questionRouter = express.Router();

// questionRouter.get("/simulations/:simulation_id/questions", questionController.getQuestionsBySimulation);
// questionRouter.get("/questions/:id", questionController.getOneQuestion);

// questionRouter.post("/simulations/:simulation_id/questions", authMiddleware, checkRole("admin"), questionController.createQuestion);
// questionRouter.put("/questions/:id", authMiddleware, checkRole("admin"), questionController.updateQuestion);
// questionRouter.delete("/questions/:id", authMiddleware, checkRole("admin"), questionController.deleteQuestion);

// export default questionRouter;