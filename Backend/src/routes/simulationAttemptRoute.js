// import { SimulationAttemptController } from "../controllers/simulationAttemptController.js";
// import express from "express";
// import { authMiddleware } from "../utils/auth.js";
// import { checkRole } from "../middlewares/checkRoles.js";

// const attemptController = new SimulationAttemptController();
// const attemptRouter = express.Router();

// attemptRouter.post("/simulations/:id/attempts", authMiddleware, checkRole("user"), attemptController.startAttempt);
// attemptRouter.put("/simulations/:id/attempts/:attemptId", authMiddleware, checkRole("user"), attemptController.finishAttempt);

// attemptRouter.get("/attempts", authMiddleware, checkRole("admin", "user"), attemptController.getUserAttempts);
// attemptRouter.get("/attempts/:attemptId", authMiddleware, checkRole("admin", "user"), attemptController.getAttemptById);

// export default attemptRouter;