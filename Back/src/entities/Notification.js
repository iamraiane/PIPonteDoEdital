/**
 * Define o schema TypeORM da tabela "notifications" (entidade Notification) —
 * notificações in-app de prazo de editais favoritados.
 * Colunas: id (int, PK auto), user_id (int), notice_id (int), title (varchar),
 * message (varchar), days_left (int), is_read (boolean, padrão false),
 * created_at (timestamp automático).
 * Relações: user (many-to-one com User, delete em cascata),
 * notice (many-to-one com Notice, delete em cascata).
 * Índice único em (user_id, notice_id, days_left) para evitar duplicatas.
 */
import { EntitySchema } from "typeorm";

export const NotificationEntity = new EntitySchema({
    name: "Notification",
    tableName: "notifications",
    columns: {
        id: {
            primary: true,
            type: "int",
            generated: true,
        },
        user_id: {
            type: "int",
        },
        notice_id: {
            type: "int",
        },
        title: {
            type: "varchar",
        },
        message: {
            type: "varchar",
        },
        days_left: {
            type: "int",
        },
        is_read: {
            type: "boolean",
            default: false,
        },
        created_at: {
            type: "timestamp",
            createDate: true,
        },
    },
    relations: {
        user: {
            type: "many-to-one",
            target: "User",
            joinColumn: { name: "user_id" },
            onDelete: "CASCADE",
        },
        notice: {
            type: "many-to-one",
            target: "Notice",
            joinColumn: { name: "notice_id" },
            onDelete: "CASCADE",
        },
    },
    indices: [
        {
            name: "IDX_notifications_user_notice_days",
            unique: true,
            columns: ["user_id", "notice_id", "days_left"],
        },
    ],
});
