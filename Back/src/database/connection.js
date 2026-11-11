/**
 * Cria e exporta um pool de conexão mysql2/promise com o banco de dados,
 * usando as credenciais das variáveis de ambiente (.env) e porta padrão 3306.
 * Esse pool é usado nas consultas feitas fora do TypeORM (jobs e scripts).
 */
import mysql from 'mysql2/promise';
import 'dotenv/config';

const db = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT || 3306
});

export default db;