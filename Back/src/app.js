/**
 * Monta a aplicação Express: habilita o CORS, faz o parse do JSON das
 * requisições e registra os routers dos módulos ativos — usuários/auth,
 * dúvidas e respostas, favoritos, notificações/preferências, notícias,
 * busca e assinaturas. Os routers de questões e simulações estão
 * comentados (fora de uso) e não são registrados.
 */
import express from "express";
import router from "./routes/userRoutes.js";
import doubtRouter from "./routes/doubtRoute.js";
import doubtAnswerRouter from "./routes/doubtAnswerRoute.js";
import favoriteRouter from "./routes/favoriteRoute.js";
import notificationRoutes from "./routes/notificationPreferenceRoute.js";
import noticeRoutes from "./routes/noticeRoutes.js";
import searchRouter from "./routes/searchRoute.js";
import subscriptionRoutes from "./routes/subscriptionRoutes.js";

import cors from "cors";

const app = express();
app.use(cors());
app.use(express.json());

app.use(router);
app.use(doubtRouter);
app.use(doubtAnswerRouter);
app.use(favoriteRouter);
app.use("/notices", noticeRoutes);
app.use(searchRouter);
app.use("/api/subscriptions", subscriptionRoutes);
app.use("/notifications", notificationRoutes);

export default app;