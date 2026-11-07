import { EntitySchema } from "typeorm";

export const DoubtEntity = new EntitySchema({
  name: "Doubt",
  tableName: "doubts",
  columns: {
    id: {
      primary: true,
      type: "int",
      generated: true,
    },
    content: {
      type: "text",
    },
    status: {
      type: "varchar",
      default: "open",
    },
    created_at: {
      type: "timestamp",
      createDate: true,
    },
    user_id: {
      type: "int",
    },
  },
  relations: {
    user: {
      type: "many-to-one",
      target: "User",
      joinColumn: { name: "user_id" },
    },
    answers: {
      type: "one-to-many",
      target: "DoubtAnswer",
      inverseSide: "doubt",
    },
  },
});