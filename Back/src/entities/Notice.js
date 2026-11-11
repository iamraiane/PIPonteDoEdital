/**
 * Define o schema TypeORM da tabela "notices" (entidade Notice) — editais/publicações.
 * Colunas: id (int, PK auto), title (varchar), state (varchar), state_code (varchar),
 * description (text), themes (simple-array), link (varchar único), publication_date (date),
 * deadline_date (date), created_at (timestamp automático).
 * Relações: email_logs (one-to-many com EmailLog), favorites (one-to-many com Favorite),
 * notifications (one-to-many com Notification).
 */
import { EntitySchema } from "typeorm";

export const NoticeEntity = new EntitySchema({
  name: "Notice",

  tableName: "notices",

  columns: {
    id: {
      primary: true,
      type: "int",
      generated: true,
    },

    title: {
      type: "varchar",
      nullable: false,
    },

    state: {
      type: "varchar",
      nullable: true,
    },

    state_code: {
      type: "varchar",
      nullable: true,
    },

    description: {
      type: "text",
      nullable: true,
    },

    themes: {
      type: "simple-array",
      nullable: true,
    },

    link: {
      type: "varchar",
      unique: true,
      nullable: false,
    },

    publication_date: {
      type: "date",
      nullable: true,
    },

    deadline_date: {
      type: "date",
      nullable: true,
    },

    created_at: {
      type: "timestamp",
      createDate: true,
    },
  },

  relations: {
    email_logs: {
      type: "one-to-many",
      target: "EmailLog",
      inverseSide: "notice",
    },

    favorites: {
      type: "one-to-many",
      target: "Favorite",
      inverseSide: "notice",
    },

    notifications: {
      type: "one-to-many",
      target: "Notification",
      inverseSide: "notice",
    },
  },
});
