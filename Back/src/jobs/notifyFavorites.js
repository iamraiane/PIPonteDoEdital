import cron from "node-cron";
import { AppDataSource } from "../../data-source.js";
import { sendNoticeReminder } from "../utils/emailUtils.js";
import { NOTIFICATION_OPTIONS } from "../utils/notificationOptions.js";
import { NotificationEntity } from "../entities/Notification.js";

const TIMEZONE = "America/Sao_Paulo";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function dateInSaoPaulo(offsetDays) {
    const date = new Date(Date.now() + offsetDays * 24 * 60 * 60 * 1000);
    return new Intl.DateTimeFormat("en-CA", { timeZone: TIMEZONE }).format(date);
}

// Colunas "date" podem vir como string "YYYY-MM-DD" ou como objeto Date
// (meia-noite no fuso local do servidor) — normaliza para "YYYY-MM-DD".
function toDateString(value) {
    if (value instanceof Date) {
        const y = value.getFullYear();
        const m = String(value.getMonth() + 1).padStart(2, "0");
        const d = String(value.getDate()).padStart(2, "0");
        return `${y}-${m}-${d}`;
    }
    return String(value).slice(0, 10);
}

function buildMessage(title, daysLeft) {
    if (daysLeft === 0) return `O prazo de "${title}" termina hoje!`;
    if (daysLeft === 1) return `O prazo de "${title}" termina amanhã!`;
    return `O prazo de "${title}" termina em ${daysLeft} dias!`;
}

export async function runFavoriteNotifications() {
    const favoriteRepository = AppDataSource.getRepository("Favorite");
    const notificationRepository = AppDataSource.getRepository(NotificationEntity);

    const dateToDays = {};
    for (const days of NOTIFICATION_OPTIONS) {
        dateToDays[dateInSaoPaulo(days)] = days;
    }
    const targetDates = Object.keys(dateToDays);

    // Data de referência do aviso: usa deadline_date quando existir;
    // caso contrário cai para publication_date (campo que o admin preenche como "prazo").
    const favorites = await favoriteRepository
        .createQueryBuilder("favorite")
        .innerJoinAndSelect("favorite.notice", "notice")
        .innerJoinAndSelect("favorite.user", "user")
        .where("(COALESCE(notice.deadline_date, notice.publication_date) IN (:...targetDates))", { targetDates })
        .andWhere("user.active = :active", { active: true })
        .andWhere("user.email_verified = :verified", { verified: true })
        .andWhere("user.role IN (:...roles)", { roles: ["premium", "admin"] })
        .getMany();

    console.log(`Encontrados ${favorites.length} favoritos com prazo em datas de aviso`);

    for (const favorite of favorites) {
        const refDate = toDateString(favorite.notice.deadline_date ?? favorite.notice.publication_date);
        const daysLeft = dateToDays[refDate];
        if (daysLeft === undefined) continue;

        const chosen = favorite.user.notification_days;
        if (chosen !== null && chosen !== undefined && !chosen.map(Number).includes(daysLeft)) {
            continue;
        }

        const alreadyNotified = await notificationRepository.findOne({
            where: {
                user_id: favorite.user.id,
                notice_id: favorite.notice.id,
                days_left: daysLeft,
            },
        });

        if (!alreadyNotified) {
            try {
                await notificationRepository.save({
                    user_id: favorite.user.id,
                    notice_id: favorite.notice.id,
                    title: favorite.notice.title,
                    message: buildMessage(favorite.notice.title, daysLeft),
                    days_left: daysLeft,
                    is_read: false,
                });
                console.log(`Notificação in-app criada para ${favorite.user.email} (${daysLeft} dias): "${favorite.notice.title}"`);
            } catch (err) {
                console.error(`Erro ao criar notificação in-app para favorite ${favorite.id}:`, err);
            }
        }

        try {
            await sendNoticeReminder(favorite.user.email, favorite.notice, daysLeft);
            console.log(`Aviso (${daysLeft} dias) enviado para ${favorite.user.email}: "${favorite.notice.title}"`);
        } catch (err) {
            console.error(`Erro ao notificar favorite ${favorite.id}:`, err);
        }

        await sleep(600); // respeita o limite de requisições do Resend
    }
}

export function startFavoriteNotificationJob() {
    cron.schedule("0 8 * * *", runFavoriteNotifications, { timezone: TIMEZONE });
}
