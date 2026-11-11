/**
 * Seed de criação do usuário premium (role "premium").
 * Inicializa a conexão com o banco e cria o usuário com base nas variáveis PREMIUM_* do .env,
 * caso ele ainda não exista. Senha criptografada com bcrypt (10 salt rounds) e e-mail já verificado.
 * Ao final, encerra a conexão com o banco.
 */
import "dotenv/config";
import { AppDataSource } from "../../data-source.js";
import { UserEntity } from "../entities/User.js";
import bcrypt from "bcrypt";

await AppDataSource.initialize();

const userRepo = AppDataSource.getRepository(UserEntity);

const premiumExists = await userRepo.findOne({
    where: { email: process.env.PREMIUM_EMAIL }
});

if (premiumExists) {
    console.log("User Premium já existe!");
} else {
    await userRepo.save({
        name: process.env.PREMIUM_NAME,
        email: process.env.PREMIUM_EMAIL,
        password_hash: await bcrypt.hash(process.env.PREMIUM_PASSWORD, 10),
        cpf: process.env.PREMIUM_CPF,
        data_nascimento: process.env.PREMIUM_DATA_NASCIMENTO,
        role: "premium",
        email_verified: true,
    });
    console.log("User Premium criado com sucesso!");
}

await AppDataSource.destroy();