/**
 * Define o schema TypeORM da tabela "doubt_answers" (entidade DoubtAnswer).
 * Colunas: id (int, PK auto), content (text), created_at (timestamp automático),
 * doubt_id (int), answered_by (int).
 * Relações: doubt (many-to-one com Doubt via doubt_id, delete em cascata),
 * user (many-to-one com User via answered_by — quem respondeu).
 */
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
      onDelete: "CASCADE",
    },
    user: {
      type: "many-to-one",
      target: "User",
      joinColumn: { name: "answered_by" },
    },
  },
});