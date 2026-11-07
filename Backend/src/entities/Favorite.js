import { EntitySchema } from "typeorm";

export const FavoriteEntity = new EntitySchema({
    name: "Favorite",
    tableName: "favorites",
    columns: {
        id: {
            primary: true,
            type: "int",
            generated: true,
        },
        created_at: {
            type: "timestamp",
            createDate: true,
        },
        user_id: {
            type: "int",
        },
        notice_id: {
            type: "int",
        },
        notified: {
            type: "boolean",
            default: false,
        },
    },
    relations: {
        user: {
            type: "many-to-one",
            target: "User",
            joinColumn: { name: "user_id" },
        },
        notice: {
            type: "many-to-one",
            target: "Notice",
            joinColumn: { name: "notice_id" },
        },
    },
});