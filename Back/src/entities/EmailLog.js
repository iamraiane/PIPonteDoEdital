import { EntitySchema } from "typeorm";

export const EmailLogEntity = new EntitySchema({
  name: "EmailLog",
  tableName: "email_logs",
  columns: {
    id: {
      primary: true,
      type: "int",
      generated: true,
    },
    sent_at: {
      type: "timestamp",
      createDate: true,
    },
    user_id: {
      type: "int",
    },
    notice_id: {
      type: "int",
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
    },
  },
});