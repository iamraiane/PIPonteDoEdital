/**
 * Define o schema TypeORM da tabela "users" (entidade User) — contas de usuário.
 * Colunas: id (int, PK auto), name (varchar), email (varchar único),
 * cpf (varchar único), data_nascimento (date), password_hash (varchar),
 * state_code (varchar), preferences (simple-array), pending_email (varchar),
 * notification_days (simple-array), active (boolean, padrão true),
 * role (enum: user/admin/premium, padrão "user"), email_verified (boolean),
 * created_at (timestamp automático), avatar_blob (varchar 255),
 * avatar_url (varchar 500).
 * Relações: subscriptions (one-to-many com Subscription),
 * email_logs (one-to-many com EmailLog), favorites (one-to-many com Favorite),
 * notifications (one-to-many com Notification).
 */
import { EntitySchema } from "typeorm";

export const UserEntity = new EntitySchema({
  name: "User",
  tableName: "users",
  columns: {
    id: {
      primary: true,
      type: "int",
      generated: true,
    },
    name: {
      type: "varchar",
    },
    email: {
      type: "varchar",
      unique: true,
    },
    cpf: {
      type: "varchar",
      unique: true,
    },
    data_nascimento: {
      type: "date",
      nullable: true,
    },
    password_hash: {
      type: "varchar",
    },
    state_code: {
      type: "varchar",
      nullable: true,
    },
    preferences: {
      type: "simple-array",
      nullable: true,
    },
    pending_email: {
      type: "varchar",
      nullable: true,
    },
    notification_days: {
      type: "simple-array",
      nullable: true,
    },
    active: {
      type: "boolean",
      default: true,
    },
    role: {
      type: "enum",
      enum: ["user", "admin", "premium"],
      default: "user",
    },
    email_verified: {
      type: "boolean",
      default: false,
    },
    created_at: {
      type: "timestamp",
      createDate: true,
    },
        avatar_blob: {
      type: "varchar",
      length: 255,
      nullable: true,
    },
    avatar_url: {
      type: "varchar",
      length: 500,
      nullable: true,
    },
  },
  relations: {
    subscriptions: {
      type: "one-to-many",
      target: "Subscription",
      inverseSide: "user",
    },
    email_logs: {
      type: "one-to-many",
      target: "EmailLog",
      inverseSide: "user",
    },
    favorites: {
      type: "one-to-many",
      target: "Favorite",
      inverseSide: "user",
    },
    notifications: {
      type: "one-to-many",
      target: "Notification",
      inverseSide: "user",
    },
  },
});
