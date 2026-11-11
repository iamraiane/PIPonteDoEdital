/**
 * Define o schema TypeORM da tabela "areas" (entidade Area).
 * Colunas: id (int, PK auto), name (varchar).
 * Relações: notices (one-to-many com Notice, lado inverso "area").
 */
import { EntitySchema } from "typeorm";

export const AreaEntity = new EntitySchema({
  name: "Area",
  tableName: "areas",
  columns: {
    id: {
      primary: true,
      type: "int",
      generated: true,
    },
    name: {
      type: "varchar",
    },
  },
  relations: {
    notices: {
      type: "one-to-many",
      target: "Notice",
      inverseSide: "area",
    },
  },
});