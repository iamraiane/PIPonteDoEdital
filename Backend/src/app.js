import express from "express";
import router from "./routes/userRoutes.js";
import doubtRouter from "./routes/doubtRoute.js";
import doubtAnswerRouter from "./routes/doubtAnswerRoute.js";
import favoriteRouter from "./routes/favoriteRoute.js";
import notificationRoutes from "./routes/notificationPreferenceRoute.js";
// import questionRouter from "./routes/questionRoute.js";
// import simulationRouter from "./routes/simulationRoute.js";
// import attemptRouter from "./routes/simulationAttemptRoute.js";
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
// app.use(questionRouter);
// app.use(simulationRouter);
// app.use(attemptRouter);
app.use("/notices", noticeRoutes);
app.use(searchRouter);
app.use("/api/subscriptions", subscriptionRoutes);
app.use("/notifications", notificationRoutes);

export default app;