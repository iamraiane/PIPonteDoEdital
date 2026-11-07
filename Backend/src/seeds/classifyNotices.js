import "dotenv/config";
import { AppDataSource } from "../../data-source.js";
import { NoticeEntity } from "../entities/Notice.js";
import { classifyNotice } from "../services/themeClassifier.js";

await AppDataSource.initialize();

const noticeRepo = AppDataSource.getRepository(NoticeEntity);

const notices = await noticeRepo.find();
let classified = 0;
let alreadyHadThemes = 0;

for (const notice of notices) {
    if (notice.themes !== null && notice.themes !== undefined) {
        alreadyHadThemes += 1;
        continue;
    }
    const themes = classifyNotice(notice.title, notice.description);
    notice.themes = themes;
    await noticeRepo.save(notice);
    classified += 1;
    console.log(`#${notice.id} "${notice.title}" -> ${themes.length > 0 ? themes.join(", ") : "(sem tema)"}`);
}

console.log(`\nPronto: ${classified} editais classificados, ${alreadyHadThemes} já tinham temas.`);

await AppDataSource.destroy();
