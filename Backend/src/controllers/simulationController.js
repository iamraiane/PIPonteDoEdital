// import { AppDataSource } from "../../data-source.js";
// import { SimulationEntity } from "../entities/Simulation.js";
// import { QuestionEntity } from "../entities/Question.js";

// export class SimulationController {

//     async createSimulation(req, res) {
//         try {
//             const simulationRepo = AppDataSource.getRepository(SimulationEntity);
//             const questionRepo = AppDataSource.getRepository(QuestionEntity);

//             const { title, notice_id, area_id, questions } = req.body;

//             const simulation = simulationRepo.create({ title, notice_id, area_id });
//             await simulationRepo.save(simulation);

//             if (questions && questions.length > 0) {
//                 const questionsToSave = questions.map((q) =>
//                     questionRepo.create({ ...q, simulation_id: simulation.id })
//                 );
//                 await questionRepo.save(questionsToSave);
//             }

//             const simulationWithQuestions = await simulationRepo.findOne({
//                 where: { id: simulation.id },
//                 relations: ["questions"],
//             });

//             return res.status(201).json(simulationWithQuestions);
//         } catch (error) {
//             console.error(error);
//             return res.status(500).json({ message: "Internal server error" });
//         }
//     }

//     async getAllSimulations(req, res) {
//         try {
//             const simulationRepo = AppDataSource.getRepository(SimulationEntity);

//             const simulations = await simulationRepo.find({
//                 relations: ["area", "notice"],
//             });

//             return res.json(simulations);
//         } catch (error) {
//             console.error(error);
//             return res.status(500).json({ message: "Internal server error" });
//         }
//     }

//     async getOneSimulation(req, res) {
//         try {
//             const simulationRepo = AppDataSource.getRepository(SimulationEntity);

//             const { id } = req.params;

//             const simulation = await simulationRepo.findOne({
//                 where: { id: parseInt(id) },
//                 relations: ["questions", "area", "notice"],
//             });

//             if (!simulation) {
//                 return res.status(404).json({ message: "Simulation not found" });
//             }

//             return res.json(simulation);
//         } catch (error) {
//             console.error(error);
//             return res.status(500).json({ message: "Internal server error" });
//         }
//     }

//     async updateSimulation(req, res) {
//         try {
//             const simulationRepo = AppDataSource.getRepository(SimulationEntity);

//             const { id } = req.params;
//             const { title, notice_id, area_id } = req.body;

//             const simulation = await simulationRepo.findOneBy({ id: parseInt(id) });

//             if (!simulation) {
//                 return res.status(404).json({ message: "Simulation not found" });
//             }

//             if (title) simulation.title = title;
//             if (notice_id) simulation.notice_id = notice_id;
//             if (area_id) simulation.area_id = area_id;

//             await simulationRepo.save(simulation);

//             return res.status(200).json({ message: "Simulation updated successfully" });
//         } catch (error) {
//             console.error(error);
//             return res.status(500).json({ message: "Internal server error" });
//         }
//     }

//     async deleteSimulation(req, res) {
//         try {
//             const simulationRepo = AppDataSource.getRepository(SimulationEntity);
//             const questionRepo = AppDataSource.getRepository(QuestionEntity);

//             const { id } = req.params;

//             const simulation = await simulationRepo.findOneBy({ id: parseInt(id) });

//             if (!simulation) {
//                 return res.status(404).json({ message: "Simulation not found" });
//             }

//             await questionRepo.delete({ simulation_id: parseInt(id) });
//             await simulationRepo.remove(simulation);

//             return res.status(200).json({ message: "Simulation deleted successfully" });
//         } catch (error) {
//             console.error(error);
//             return res.status(500).json({ message: "Internal server error" });
//         }
//     }
// }