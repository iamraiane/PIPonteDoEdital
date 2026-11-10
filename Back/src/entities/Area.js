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