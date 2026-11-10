// import { SimulationController } from "../controllers/simulationController.js";
// import express from "express";
// import { authMiddleware } from "../utils/auth.js";
// import { checkRole } from "../middlewares/checkRoles.js";

// const simulationController = new SimulationController();
// const simulationRouter = express.Router();
    

// simulationRouter.get("/simulations", simulationController.getAllSimulations);
// simulationRouter.get("/simulations/:id", simulationController.getOneSimulation);

// simulationRouter.post("/simulations", authMiddleware, checkRole("admin"), simulationController.createSimulation);
// simulationRouter.put("/simulations/:id", authMiddleware, checkRole("admin"), simulationController.updateSimulation);
// simulationRouter.delete("/simulations/:id", authMiddleware, checkRole("admin"), simulationController.deleteSimulation);

// export default simulationRouter;