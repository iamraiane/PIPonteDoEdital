
/**
 * Define o schema TypeORM da tabela "subscriptions" (entidade Subscription) —
 * assinaturas criadas no Mercado Pago.
 * Colunas: id (int, PK auto), status (varchar, padrão "pending"),
 * mercado_pago_subscription_id (varchar único), external_reference (varchar único),
 * amount (decimal 10,2), currency (varchar 3, padrão "BRL"), start_date (datetime),
 * end_date (datetime), created_at/updated_at (timestamps automáticos),
 * user_id (int), plan_id (int).
 * Relações: user (many-to-one com User, delete em cascata),
 * plan (many-to-one com Plan, delete RESTRICT).
 */
import { EntitySchema } from "typeorm";

export const SubscriptionEntity = new EntitySchema({
  name: "Subscription",
  tableName: "subscriptions",

  columns: {
    id: {
      primary: true,
      type: "int",
      generated: true,
    },

    status: {
      type: "varchar",
      length: 30,
      default: "pending",
    },

    mercado_pago_subscription_id: {
      type: "varchar",
      length: 100,
      nullable: true,
      unique: true,
    },

    external_reference: {
      type: "varchar",
      length: 100,
      unique: true,
    },

    amount: {
      type: "decimal",
      precision: 10,
      scale: 2,
    },

    currency: {
      type: "varchar",
      length: 3,
      default: "BRL",
    },

    start_date: {
      type: "datetime",
      nullable: true,
    },

    end_date: {
      type: "datetime",
      nullable: true,
    },

    created_at: {
      type: "timestamp",
      createDate: true,
    },

    updated_at: {
      type: "timestamp",
      updateDate: true,
    },

    user_id: {
      type: "int",
    },

    plan_id: {
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

    plan: {
      type: "many-to-one",
      target: "Plan",
      joinColumn: { name: "plan_id" },
      onDelete: "RESTRICT",
    },
  },
});
