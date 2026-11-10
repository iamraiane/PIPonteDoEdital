import "dotenv/config";
import { AppDataSource } from "../../data-source.js";
import { UserEntity } from "../entities/User.js";
import { NoticeEntity } from "../entities/Notice.js";
import { FavoriteEntity } from "../entities/Favorite.js";

await AppDataSource.initialize();

const userRepo = AppDataSource.getRepository(UserEntity);
const noticeRepo = AppDataSource.getRepository(NoticeEntity);
const favoriteRepo = AppDataSource.getRepository(FavoriteEntity);

const testUser = await userRepo.findOne({
    where: { email: process.env.ADMIN_EMAIL }
});

if (!testUser) {
    console.log("Usuário admin não encontrado. Rode o createAdmin.js primeiro.");
    await AppDataSource.destroy();
    process.exit(1);
}

const targetDate = new Date();
targetDate.setDate(targetDate.getDate() + 7);
const targetDateStr = targetDate.toISOString().split("T")[0]; 

let testNotice = await noticeRepo.findOne({ where: {} });

if (!testNotice) {
    console.log("Nenhuma notice encontrada no banco. Crie uma notice antes de rodar esse seed.");
    await AppDataSource.destroy();
    process.exit(1);
}

testNotice.deadline_date = targetDateStr;
await noticeRepo.save(testNotice);

const favoriteExists = await favoriteRepo.findOne({
    where: { user_id: testUser.id, notice_id: testNotice.id }
});

if (favoriteExists) {
    console.log("Favorite de teste já existe!");
} else {
    await favoriteRepo.save({
        user_id: testUser.id,
        notice_id: testNotice.id,
    });
    console.log(`Favorite de teste criado! Notice "${testNotice.title}" com deadline_date = ${targetDateStr} (7 dias a partir de hoje, data-alvo de notificação)`);
}

await AppDataSource.destroy();