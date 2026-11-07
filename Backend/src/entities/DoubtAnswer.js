import { EntitySchema } from "typeorm";

export const DoubtAnswerEntity = new EntitySchema({
  name: "DoubtAnswer",
  tableName: "doubt_answers",
  columns: {
    id: {
      primary: true,
      type: "int",
      generated: true,
    },
    content: {
      type: "text",
    },
    created_at: {
      type: "timestamp",
      createDate: true,
    },
    doubt_id: {
      type: "int",
    },
    answered_by: {
      type: "int",
    },
  },
  relations: {
    doubt: {
      type: "many-to-one",
      target: "Doubt",
      joinColumn: { name: "doubt_id" },
    },
    user: {
      type: "many-to-one",
      target: "User",
      joinColumn: { name: "answered_by" },
    },
  },
});