import { AppDataSource } from "../data-source.js"; 
import app from "./app.js"; 
import { startFavoriteNotificationJob } from "./jobs/notifyFavorites.js";

AppDataSource.initialize()
    .then(() => {
        console.log("Banco conectado");

        startFavoriteNotificationJob();
        console.log("Job de notificações iniciado");

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
});
    })
    .catch((error) => console.log("Erro:", error));