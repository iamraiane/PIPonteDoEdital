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
