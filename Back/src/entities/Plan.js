
/**
 * Define o schema TypeORM da tabela "plan" (entidade Plan) — planos de assinatura.
 * Colunas: id (int, PK auto), name (varchar), description (varchar),
 * value (decimal 10,2), activate (boolean, padrão true), created_at (timestamp automático).
 * Relações: subscriptions (one-to-many com Subscription, lado inverso "plan").
 */
import { EntitySchema } from "typeorm";

export const PlanEntity = new EntitySchema({
  name: "Plan",
  tableName: "plan",

  columns: {
    id: {
      primary: true,
      type: "int",
      generated: true,
    },

    name: {
      type: "varchar",
    },

    description: {
      type: "varchar",
      nullable: true,
    },

    value: {
      type: "decimal",
      precision: 10,
      scale: 2,
    },

    activate: {
      type: "boolean",
      default: true,
    },

    created_at: {
      type: "timestamp",
      createDate: true,
    },
  },

  relations: {
    subscriptions: {
      type: "one-to-many",
      target: "Subscription",
      inverseSide: "plan",
    },
  },
});
