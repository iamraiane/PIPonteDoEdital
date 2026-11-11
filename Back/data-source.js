/**
 * Configura e exporta a instância única do TypeORM DataSource (banco MySQL).
 * Lê host, porta, usuário, senha e nome do banco das variáveis de ambiente
 * (.env), carrega as entidades de "src/entities/*.js" e mantém synchronize
 * ativo para sincronizar o schema automaticamente com as entidades.
 */
import "reflect-metadata";
import { DataSource } from "typeorm";
import "dotenv/config";

export const AppDataSource = new DataSource({
    type: "mysql",
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT),
    username: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
      ssl: {rejectUnauthorized: false},
    synchronize: true,
    logging: false,
    entities: ["src/entities/*.js"],
    migrations: [],
    subscribers: [],
});
