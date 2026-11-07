// import { AppDataSource } from "../../data-source.js";
// import { SimulationAttemptEntity } from "../entities/SimulationAtempt.js";
// import { QuestionEntity } from "../entities/Question.js";

// export class SimulationAttemptController {

//   async startAttempt(req, res) {
//     try {
//       const attemptRepo = AppDataSource.getRepository(SimulationAttemptEntity);

//       const { id: simulation_id } = req.params;
//       const user_id = req.user.id;

//       const attemptInProgress = await attemptRepo.findOne({
//         where: { simulation_id: parseInt(simulation_id), user_id, finished_at: null },
//       });

//       if (attemptInProgress) {
//         return res.status(200).json(attemptInProgress);
//       }

//       const attempt = attemptRepo.create({
//         simulation_id: parseInt(simulation_id),
//         user_id,
//         started_at: new Date(),
//       });

//       await attemptRepo.save(attempt);

//       return res.status(201).json(attempt);
//     } catch (error) {
//       console.error(error);
//       return res.status(500).json({ message: "Internal server error" });
//     }
//   }

//   async finishAttempt(req, res) {
//     try {
//       const attemptRepo = AppDataSource.getRepository(SimulationAttemptEntity);
//       const questionRepo = AppDataSource.getRepository(QuestionEntity);

//       const { id: simulation_id, attemptId } = req.params;
//       const { answers } = req.body;
//       const user_id = req.user.id;

//       const attempt = await attemptRepo.findOne({
//         where: { id: parseInt(attemptId), simulation_id: parseInt(simulation_id), user_id },
//       });

//       if (!attempt) {
//         return res.status(404).json({ message: "Attempt not found" });
//       }

//       if (attempt.finished_at) {
//         return res.status(400).json({ message: "Attempt already finished" });
//       }

//       const questions = await questionRepo.find({
//         where: { simulation_id: parseInt(simulation_id) },
//       });
      
//       let correct = 0;
//       answers.forEach(({ question_id, answer }) => {
//         const question = questions.find((q) => q.id === question_id);
//         if (question && question.correct_option === answer) {
//           correct++;
//         }
//       });

//       const score = parseFloat(((correct / questions.length) * 10).toFixed(2));

//       attempt.finished_at = new Date();
//       attempt.score = score;

//       await attemptRepo.save(attempt);

//       return res.status(200).json({
//         message: "Simulation finished!",
//         score,
//         correct,
//         total: questions.length,
//       });
//     } catch (error) {
//       console.error(error);
//       return res.status(500).json({ message: "Internal server error" });
//     }
//   }

//   async getUserAttempts(req, res) {
//     try {
//       const attemptRepo = AppDataSource.getRepository(SimulationAttemptEntity);

//       const user_id = req.user.id;

//       const attempts = await attemptRepo.find({
//         where: { user_id },
//         relations: ["simulation"],
//         order: { started_at: "DESC" },
//       });

//       return res.json(attempts);
//     } catch (error) {
//       console.error(error);
//       return res.status(500).json({ message: "Internal server error" });
//     }
//   }

//   async getAttemptById(req, res) {
//     try {
//       const attemptRepo = AppDataSource.getRepository(SimulationAttemptEntity);

//       const { attemptId } = req.params;
//       const user_id = req.user.id;

//       const attempt = await attemptRepo.findOne({
//         where: { id: parseInt(attemptId), user_id },
//         relations: ["simulation", "simulation.questions"],
//       });

//       if (!attempt) {
//         return res.status(404).json({ message: "Attempt not found" });
//       }

//       return res.json(attempt);
//     } catch (error) {
//       console.error(error);
//       return res.status(500).json({ message: "Internal server error" });
//     }
//   }
// }