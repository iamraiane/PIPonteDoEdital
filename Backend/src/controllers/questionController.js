// import { AppDataSource } from "../../data-source.js";
// import { QuestionEntity } from "../entities/Question.js";

// export class QuestionController {

//     async createQuestion(req, res) {
//         try {
//             const questionRepo = AppDataSource.getRepository(QuestionEntity);

//             const { simulation_id } = req.params;
//             const { statement, option_a, option_b, option_c, option_d, option_e, correct_option } = req.body;

//             const question = questionRepo.create({
//                 simulation_id: parseInt(simulation_id),
//                 statement,
//                 option_a,
//                 option_b,
//                 option_c,
//                 option_d,
//                 option_e,
//                 correct_option,
//             });

//             await questionRepo.save(question);

//             return res.status(201).json(question);
//         } catch (error) {
//             console.error(error);
//             return res.status(500).json({ message: "Internal server error" });
//         }
//     }

//     async getQuestionsBySimulation(req, res) {
//         try {
//             const questionRepo = AppDataSource.getRepository(QuestionEntity);

//             const { simulation_id } = req.params;

//             const questions = await questionRepo.find({
//                 where: { simulation_id: parseInt(simulation_id) },
//             });

//             return res.json(questions);
//         } catch (error) {
//             console.error(error);
//             return res.status(500).json({ message: "Internal server error" });
//         }
//     }

//     async getOneQuestion(req, res) {
//         try {
//             const questionRepo = AppDataSource.getRepository(QuestionEntity);

//             const { id } = req.params;

//             const question = await questionRepo.findOne({
//                 where: { id: parseInt(id) },
//                 relations: ["simulation"],
//             });

//             if (!question) {
//                 return res.status(404).json({ message: "Question not found" });
//             }

//             return res.json(question);
//         } catch (error) {
//             console.error(error);
//             return res.status(500).json({ message: "Internal server error" });
//         }
//     }

//     async updateQuestion(req, res) {
//         try {
//             const questionRepo = AppDataSource.getRepository(QuestionEntity);

//             const { id } = req.params;
//             const { statement, option_a, option_b, option_c, option_d, option_e, correct_option } = req.body;

//             const question = await questionRepo.findOneBy({ id: parseInt(id) });

//             if (!question) {
//                 return res.status(404).json({ message: "Question not found" });
//             }

//             if (statement) question.statement = statement;
//             if (option_a) question.option_a = option_a;
//             if (option_b) question.option_b = option_b;
//             if (option_c) question.option_c = option_c;
//             if (option_d) question.option_d = option_d;
//             if (option_e) question.option_e = option_e;
//             if (correct_option) question.correct_option = correct_option;

//             await questionRepo.save(question);

//             return res.status(200).json({ message: "Question updated successfully" });
//         } catch (error) {
//             console.error(error);
//             return res.status(500).json({ message: "Internal server error" });
//         }
//     }

//     async deleteQuestion(req, res) {
//         try {
//             const questionRepo = AppDataSource.getRepository(QuestionEntity);

//             const { id } = req.params;

//             const question = await questionRepo.findOneBy({ id: parseInt(id) });

//             if (!question) {
//                 return res.status(404).json({ message: "Question not found" });
//             }

//             await questionRepo.remove(question);

//             return res.status(200).json({ message: "Question deleted successfully" });
//         } catch (error) {
//             console.error(error);
//             return res.status(500).json({ message: "Internal server error" });
//         }
//     }
// }