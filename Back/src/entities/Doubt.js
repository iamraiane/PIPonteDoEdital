/**
 * Define o schema TypeORM da tabela "doubts" (entidade Doubt).
 * Colunas: id (int, PK auto), content (text), status (varchar, padrão "open"),
 * created_at (timestamp automático), user_id (int).
 * Relações: user (many-to-one com User via user_id),
 * answers (one-to-many com DoubtAnswer, lado inverso "doubt", delete em cascata).
 */
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
      onDelete: "CASCADE",
    },
  },
});