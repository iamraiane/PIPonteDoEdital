import "dotenv/config";
import { AppDataSource } from "../../data-source.js";
import { UserEntity } from "../entities/User.js";
import bcrypt from "bcrypt";

await AppDataSource.initialize();

const userRepo = AppDataSource.getRepository(UserEntity);

const normalExists = await userRepo.findOne({
    where: { email: process.env.NORMAL_EMAIL }
});

if (normalExists) {
    console.log("User Normal já existe!");
} else {
    await userRepo.save({
        name: process.env.NORMAL_NAME,
        email: process.env.NORMAL_EMAIL,
        password_hash: await bcrypt.hash(process.env.NORMAL_PASSWORD, 10),
        cpf: process.env.NORMAL_CPF,
        data_nascimento: process.env.NORMAL_DATA_NASCIMENTO,
        role: "user",
        email_verified: true,
    });
    console.log("User Normal criado com sucesso!");
}

await AppDataSource.destroy();