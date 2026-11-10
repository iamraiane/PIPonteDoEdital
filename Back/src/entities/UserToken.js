import { EntitySchema } from "typeorm";

export const UserTokenEntity = new EntitySchema({
    name: "UserToken",
    tableName: "user_tokens",
    columns: {
        id: {
            primary: true,
            type: "int",
            generated: true,
        },
        token: {
            type: "varchar",
            unique: true,
        },
        type: {
            type: "enum",
            enum: ["PASSWORD_RESET", "EMAIL_VERIFICATION", "EMAIL_CHANGE"],
        },
        user_id: {
            type: "int",
        },
        used: {
            type: "boolean",
            default: false,
        },
        expires_at: {
            type: "timestamp",
        },
        created_at: {
            type: "timestamp",
            createDate: true,
        },
    },
    relations: {
        user: {
            type: "many-to-one",
            target: "User",
            joinColumn: { name: "user_id" },
            onDelete: "CASCADE",
        },
    },
});