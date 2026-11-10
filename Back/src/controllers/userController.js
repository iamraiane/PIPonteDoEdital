import { AppDataSource } from "../../data-source.js";
import { UserEntity } from "../entities/User.js";
import { SubscriptionEntity } from "../entities/Subscription.js";
import { hashPassword } from "../utils/hash.js";
import { generateToken } from "../utils/jwt.js";
import { comparePassword } from "../utils/hash.js";
import { UserTokenEntity } from "../entities/UserToken.js";
import { generateRandomToken } from "../utils/tokenUtils.js";
import { validateCPF } from "../utils/cpfValidator.js";
import { validateName } from "../utils/nameValidator.js";
import {
  sendForgotPasswordEmail,
  sendEmailVerificationEmail,
  createEmailVerificationToken,
  createEmailChangeToken,
  sendEmailChangeEmail,
  sendEmailChangeNoticeToOldEmail,
  emailIsEqual,
} from "../utils/emailUtils.js";
import bcrypt from "bcrypt";

export class AuthController {
  async getAllUsers(req, res) {
    const repo = AppDataSource.getRepository(UserEntity);
    const users = await repo.find();
    return res.json(users);
  }

  async login(req, res) {
    try {
      const repo = AppDataSource.getRepository(UserEntity);

      const { identifier, password } = req.body;

      if (!identifier || !password) {
        return res
          .status(400)
          .json({ message: "Identifier and password are required" });
      }

      const user = await repo.findOne({
        where: [{ name: identifier }, { email: identifier }],
      });

      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const isValid = await comparePassword(password, user.password_hash);

      if (!isValid) {
        return res.status(401).json({ message: "Invalid password" });
      }

      if (!user.email_verified) {
        return res.status(403).json({
          message: "Confirme seu e-mail antes de fazer login",
          code: "EMAIL_NOT_VERIFIED",
        });
      }

      const token = generateToken(user);

      return res.json({
        message: "Login realizado",
        token,
      });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: "Internal server error" });
    }
  }

  async createUser(req, res) {
    try {
      const repo = AppDataSource.getRepository(UserEntity);
      const {
        name,
        email,
        password,
        cpf,
        data_nascimento,
        state_code,
        preferences,
      } = req.body;

      if (!name || !email || !password || !cpf || !data_nascimento) {
        return res
          .status(400)
          .json({
            message:
              "Nome, email, senha, CPF, data de nascimento são obrigatórios",
          });
      }

      const isNameValid = validateName(name);
      if (!isNameValid) {
        return res
          .status(400)
          .json({
            message:
              "Nome inválido. O nome deve conter apenas letras e espaços.",
          });
      }

      const existingUser = await repo.findOne({ where: { email } });
      if (existingUser) {
        return res.status(409).json({ message: "Email já cadastrado" });
      }

      const existingCpf = await repo.findOne({ where: { cpf } });
      if (existingCpf) {
        return res.status(409).json({ message: "CPF já cadastrado" });
      }
      if (!validateCPF(cpf)) {
        return res.status(400).json({ message: "CPF inválido" });
      }
      const dataBase = new Date();
      if (new Date(data_nascimento) > new Date(dataBase)) {
        return res.status(400).json({ message: "Data de nascimento inválida" });
      }

      const hashedPassword = await hashPassword(password);
      const user = repo.create({
        name,
        email,
        password_hash: hashedPassword,
        role: "user",
        cpf,
        data_nascimento,
        state_code,
        preferences,
      });
      await repo.save(user);

      try {
        const { token } = await createEmailVerificationToken(user.id);
        await sendEmailVerificationEmail(user.email, token);
      } catch (emailError) {
        console.error("Falha ao enviar e-mail de verificação:", emailError);
      }

      const jwtToken = generateToken(user);
      return res.status(201).json({ message: "User created", token: jwtToken });
    } catch (error) {
      if (
        error.driverError?.code === "ER_DUP_ENTRY" ||
        error.code === "ER_DUP_ENTRY"
      ) {
        return res.status(409).json({ message: "Email já cadastrado" });
      }
      console.error(error);
      return res.status(500).json({ message: "Erro interno no servidor" });
    }
  }

  async getOneUser(req, res) {
    const repo = AppDataSource.getRepository(UserEntity);

    const { id } = req.params;

    const user = await repo.findOne({
      where: { id: parseInt(id) },
    });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.json(user);
  }

  async updateUser(req, res) {
    try {
      const repo = AppDataSource.getRepository(UserEntity);
      const { id } = req.params;

      if (req.user.id !== parseInt(id)) {
        return res
          .status(403)
          .json({
            message: "Você não tem permissão para atualizar este usuário",
          });
      }

      const { name, state_code, preferences } = req.body;

      const userToUpdate = await repo.findOneBy({ id: parseInt(id) });

      if (!userToUpdate) {
        return res.status(404).json({ message: "Usuário não encontrado" });
      }

      if (name) userToUpdate.name = name;
      if (state_code) userToUpdate.state_code = state_code;
      if (preferences) userToUpdate.preferences = preferences;

      await repo.save(userToUpdate);

      return res
        .status(200)
        .json({ message: "Usuário atualizado com sucesso" });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: "Erro interno no servidor" });
    }
  }

  async deleteUser(req, res) {
    const repo = AppDataSource.getRepository(UserEntity);

    const { id } = req.params;

    const userToDelete = await repo.findOneBy({ id: parseInt(id) });

    if (!userToDelete) {
      return res.status(404).json({ message: "Usuário não encontrado" });
    }

    await repo.remove(userToDelete);

    return res.status(200).json({ message: "Usuário removido com sucesso" });
  }

  async activateUser(req, res) {
    const repo = AppDataSource.getRepository(UserEntity);

    const { id } = req.params;

    const userToEnable = await repo.findOneBy({ id: parseInt(id) });

    if (userToEnable.active === true) {
      return res.status(400).json({ message: "Usuário já está ativo" });
    }

    if (!userToEnable) {
      return res.status(404).json({ message: "Usuário não encontrado" });
    }

    userToEnable.active = true;
    await repo.save(userToEnable);
    return res.status(200).json({ message: "Usuário ativado com sucesso" });
  }

  async disableUser(req, res) {
    const repo = AppDataSource.getRepository(UserEntity);

    const { id } = req.params;

    const userToDisable = await repo.findOneBy({ id: parseInt(id) });

    if (userToDisable.active === false) {
      return res.status(400).json({ message: "Usuário já está desativado" });
    }

    if (!userToDisable) {
      return res.status(404).json({ message: "Usuário não encontrado" });
    }

    userToDisable.active = false;
    await repo.save(userToDisable);
    return res.status(200).json({ message: "Usuário desativado com sucesso" });
  }

  async getUserByEmail(req, res) {
    const repo = AppDataSource.getRepository(UserEntity);

    const { email } = req.params;

    const user = await repo.findOne({
      where: { email },
    });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.json(user);
  }

  async promoteToAdmin(req, res) {
    try {
      const repo = AppDataSource.getRepository(UserEntity);
      const { id } = req.params;

      const user = await repo.findOneBy({ id: parseInt(id) });

      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      user.role = "admin";
      await repo.save(user);

      return res
        .status(200)
        .json({ message: "User promoted to admin successfully" });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: "Internal server error" });
    }
  }
  async demoteToUser(req, res) {
    try {
      const repo = AppDataSource.getRepository(UserEntity);
      const { id } = req.params;

      const user = await repo.findOneBy({ id: parseInt(id) });

      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      user.role = "user";
      await repo.save(user);

      return res
        .status(200)
        .json({ message: "User demoted to user successfully" });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: "Internal server error" });
    }
  }

  async promoteToPremium(req, res) {
    try {
      const repo = AppDataSource.getRepository(UserEntity);
      const { id } = req.params;

      const user = await repo.findOneBy({ id: parseInt(id) });

      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      user.role = "premium";
      await repo.save(user);

      return res
        .status(200)
        .json({ message: "User promoted to premium successfully" });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: "Internal server error" });
    }
  }

  async getUserSubscription(req, res) {
    try {
      const repo = AppDataSource.getRepository(SubscriptionEntity);
      const { id } = req.params;

      const subscription = await repo.findOne({
        where: {
          user_id: parseInt(id),
          status: "active",
        },
      });

      if (!subscription) {
        return res.json({ hasPremium: false, plan: "free" });
      }

      const endDate = new Date(subscription.end_date);
      const now = new Date();

      if (endDate < now) {
        return res.json({ hasPremium: false, plan: "free" });
      }

      return res.json({ hasPremium: true, plan: subscription.plan });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: "Internal server error" });
    }
  }

  async activatePremium(req, res) {
    try {
      const repo = AppDataSource.getRepository(SubscriptionEntity);
      const { id } = req.params;

      const startDate = new Date();
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + 30);

      const subscription = repo.create({
        plan: "premium",
        status: "active",
        start_date: startDate,
        end_date: endDate,
        user_id: parseInt(id),
      });

      await repo.save(subscription);

      return res.status(201).json({ message: "Premium ativado com sucesso" });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: "Internal server error" });
    }
  }

  async deactivatePremium(req, res) {
    try {
      const repo = AppDataSource.getRepository(SubscriptionEntity);
      const { id } = req.params;

      const subscription = await repo.findOne({
        where: {
          user_id: parseInt(id),
          status: "active",
        },
      });

      if (!subscription) {
        return res.status(404).json({ message: "Subscription not found" });
      } else {
        subscription.status = "inactive";
        await repo.save(subscription);
        return res
          .status(200)
          .json({ message: "Premium desativado com sucesso" });
      }
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: "Internal server error" });
    }
  }

  async forgotPassword(req, res) {
    try {
      const { email } = req.body;

      if (!email) {
        return res.status(400).json({ message: "O e-mail é obrigatório" });
      }

      const repo = AppDataSource.getRepository(UserEntity);
      const tokenRepo = AppDataSource.getRepository(UserTokenEntity);

      const user = await repo.findOne({ where: { email } });

      if (!user) {
        return res.status(200).json({
          message:
            "Se o e-mail estiver cadastrado, você receberá um link para redefinir a senha.",
        });
      }

      await tokenRepo.update(
        { user_id: user.id, type: "PASSWORD_RESET", used: false },
        { used: true },
      );
      const token = generateRandomToken();

      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 2);

      const newToken = tokenRepo.create({
        token,
        type: "PASSWORD_RESET",
        user_id: user.id,
        expires_at: expiresAt,
        used: false,
      });

      await tokenRepo.save(newToken);

      await sendForgotPasswordEmail(user.email, token);

      return res.status(200).json({
        message:
          "Se o e-mail estiver cadastrado, você receberá um link para redefinir a senha.",
      });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: "Erro interno no servidor" });
    }
  }
  async resetPassword(req, res) {
    try {
      const { token, password } = req.body;

      if (!token || !password) {
        return res
          .status(400)
          .json({ message: "Token e nova senha são obrigatórios" });
      }

      const tokenRepo = AppDataSource.getRepository(UserTokenEntity);
      const userRepo = AppDataSource.getRepository(UserEntity);

      const userToken = await tokenRepo.findOne({
        where: { token, used: false, type: "PASSWORD_RESET" },
      });

      if (!userToken) {
        return res
          .status(400)
          .json({ message: "Token inválido ou já utilizado" });
      }

      const now = new Date();
      if (now > new Date(userToken.expires_at)) {
        return res
          .status(400)
          .json({ message: "Token expirado, solicite uma nova recuperação" });
      }

      const hashedPassword = await hashPassword(password);
      const user = await userRepo.update(
        { id: userToken.user_id },
        {
          password_hash: hashedPassword,
        },
      );

      userToken.used = true;
      await tokenRepo.save(userToken);

      return res.status(200).json({ message: "Senha redefinida com sucesso" });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: "Erro interno no servidor" });
    }
  }
  async verifyEmail(req, res) {
    try {
      const { token } = req.body;

      if (!token) {
        return res.status(400).json({ message: "Token é obrigatório" });
      }

      const tokenRepo = AppDataSource.getRepository(UserTokenEntity);
      const userRepo = AppDataSource.getRepository(UserEntity);

      const userToken = await tokenRepo.findOne({
        where: { token, type: "EMAIL_VERIFICATION", used: false },
      });

      if (!userToken) {
        return res
          .status(400)
          .json({ message: "Token inválido ou já utilizado" });
      }

      if (new Date() > new Date(userToken.expires_at)) {
        return res
          .status(400)
          .json({
            message: "Token expirado, solicite um novo e-mail de confirmação",
          });
      }

      await userRepo.update(
        { id: userToken.user_id },
        { email_verified: true },
      );

      userToken.used = true;
      await tokenRepo.save(userToken);

      return res.status(200).json({ message: "E-mail verificado com sucesso" });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: "Erro interno no servidor" });
    }
  }
  async toChangeYourEmail(req, res) {
    try {
      const id = req.user.id;
      const { email, password } = req.body;

      if (!email) {
        return res.status(400).json({ message: "O e-mail é obrigatório" });
      }
      if (!password) {
        return res.status(400).json({ message: "A senha é obrigatória" });
      }

      const newEmail = email.trim().toLowerCase();

      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newEmail)) {
        return res
          .status(400)
          .json({ message: "O e-mail fornecido é inválido" });
      }

      const userRepo = AppDataSource.getRepository(UserEntity);

      const user = await userRepo.findOne({ where: { id } });
      if (!user) {
        return res.status(404).json({ message: "Usuário não encontrado" });
      }

      const passwordOk = await bcrypt.compare(password, user.password_hash);
      if (!passwordOk) {
        return res.status(401).json({ message: "Senha incorreta" });
      }

      if (emailIsEqual(newEmail, user.email)) {
        return res
          .status(400)
          .json({ message: "O novo e-mail é igual ao atual" });
      }

      const emailInUse = await userRepo.findOne({ where: { email: newEmail } });
      if (emailInUse) {
        return res.status(409).json({ message: "E-mail já está em uso" });
      }

      await userRepo.update({ id }, { pending_email: newEmail });

      const userToken = await createEmailChangeToken(id);

      await sendEmailChangeEmail(newEmail, userToken.token);
      await sendEmailChangeNoticeToOldEmail(user.email);

      return res
        .status(200)
        .json({
          message: "Enviamos um link de confirmação para o novo e-mail",
        });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: "Erro interno no servidor" });
    }
  }
  async confirmEmailChange(req, res) {
    try {
      const { token } = req.body;

      if (!token) {
        return res.status(400).json({ message: "Token é obrigatório" });
      }

      const tokenRepo = AppDataSource.getRepository(UserTokenEntity);
      const userRepo = AppDataSource.getRepository(UserEntity);

      const userToken = await tokenRepo.findOne({
        where: { token, type: "EMAIL_CHANGE", used: false },
      });

      if (!userToken) {
        return res
          .status(400)
          .json({ message: "Token inválido ou já utilizado" });
      }

      if (new Date() > new Date(userToken.expires_at)) {
        return res
          .status(400)
          .json({
            message: "Token expirado, solicite a troca de e-mail novamente",
          });
      }

      const user = await userRepo.findOne({ where: { id: userToken.user_id } });

      if (!user || !user.pending_email) {
        return res
          .status(400)
          .json({ message: "Nenhuma troca de e-mail pendente" });
      }

      const emailInUse = await userRepo.findOne({
        where: { email: user.pending_email },
      });
      if (emailInUse) {
        return res.status(409).json({ message: "E-mail já está em uso" });
      }

      await AppDataSource.transaction(async (manager) => {
        await manager.update(
          UserEntity,
          { id: user.id },
          {
            email: user.pending_email,
            email_verified: true,
            pending_email: null,
          },
        );

        await manager.update(
          UserTokenEntity,
          { id: userToken.id },
          { used: true },
        );
      });

      return res.status(200).json({ message: "E-mail atualizado com sucesso" });
    } catch (error) {
      if (error.code === "ER_DUP_ENTRY" || error.code === "23505") {
        return res.status(409).json({ message: "E-mail já está em uso" });
      }

      console.error(error);
      return res.status(500).json({ message: "Erro interno no servidor" });
    }
  }
  async resendVerificationEmail(req, res) {
    try {
      const { email } = req.body;

      if (!email) {
        return res.status(400).json({ message: "O e-mail é obrigatório" });
      }

      const normalizedEmail = email.trim().toLowerCase();

      const genericResponse = {
        message:
          "Se existir uma conta não verificada com esse e-mail, enviaremos um novo link de confirmação",
      };

      const userRepo = AppDataSource.getRepository(UserEntity);
      const tokenRepo = AppDataSource.getRepository(UserTokenEntity);

      const user = await userRepo.findOne({
        where: { email: normalizedEmail },
      });

      if (!user || user.email_verified) {
        return res.status(200).json(genericResponse);
      }

      const lastToken = await tokenRepo.findOne({
        where: { user_id: user.id, type: "EMAIL_VERIFICATION" },
        order: { created_at: "DESC" },
      });

      if (
        lastToken &&
        Date.now() - new Date(lastToken.created_at).getTime() < 60 * 1000
      ) {
        return res
          .status(429)
          .json({
            message: "Aguarde um minuto antes de solicitar outro e-mail",
          });
      }

      const userToken = await createEmailVerificationToken(user.id);
      await sendEmailVerificationEmail(user.email, userToken.token);

      return res.status(200).json(genericResponse);
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: "Erro interno no servidor" });
    }
  }
}
