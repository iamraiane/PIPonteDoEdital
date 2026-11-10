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
