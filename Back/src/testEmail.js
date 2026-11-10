import "dotenv/config";
import { sendNoticeReminder } from "./utils/emailUtils.js";

const testNotice = {
    title: "Concurso Teste",
    link: "https://exemplo.com",
    publication_date: new Date(),
};

sendNoticeReminder("gustavonori558@gmail.com", testNotice, 0)
    .then(() => {
        console.log("E-mail enviado com sucesso! Confere sua caixa de entrada.");
        process.exit(0);
    })
    .catch((err) => {
        console.error("Erro ao enviar e-mail:", err);
        process.exit(1);
    });
