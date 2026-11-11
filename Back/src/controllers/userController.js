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
  enviarAvatar,
  apagarBlob,
  validarImagem,
} from "../services/blobService.js";
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

/**
 * Controller principal de autenticação e gestão de usuários.
 * Concentra login, cadastro, CRUD, papéis (role), assinatura premium,
 * recuperação de senha e fluxos de verificação/troca de e-mail.
 */
export class AuthController {
  /**
   * Lista todos os usuários cadastrados.
   * @param {import("express").Request} req
   * @param {import("express").Response} res
   * @returns {Promise<void>} Responde com JSON e status HTTP apropriado.
   */
  async getAllUsers(req, res) {
    const repo = AppDataSource.getRepository(UserEntity);
    const users = await repo.find();
    return res.json(users);
  }

  /**
   * Autentica o usuário por nome ou e-mail.
   * Valida credenciais, exige e-mail verificado (caso contrário responde
   * 403 com código EMAIL_NOT_VERIFIED) e retorna um token JWT.
   * @param {import("express").Request} req
   * @param {import("express").Response} res
   * @returns {Promise<void>} Responde com JSON e status HTTP apropriado.
   */
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

  /**
   * Cria um novo usuário (cadastro).
   * Valida campos obrigatórios, nome, unicidade de e-mail e CPF, CPF válido
   * e data de nascimento no passado; persiste a senha com hash, envia e-mail
   * de verificação (falha no envio não impede o cadastro) e retorna token JWT.
   * @param {import("express").Request} req
   * @param {import("express").Response} res
   * @returns {Promise<void>} Responde com JSON e status HTTP apropriado.
   */
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
        return res.status(400).json({
          message:
            "Nome, email, senha, CPF, data de nascimento são obrigatórios",
        });
      }

      const isNameValid = validateName(name);
      if (!isNameValid) {
        return res.status(400).json({
          message: "Nome inválido. O nome deve conter apenas letras e espaços.",
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

  /**
   * Busca um usuário pelo ID.
   * @param {import("express").Request} req
   * @param {import("express").Response} res
   * @returns {Promise<void>} Responde com JSON e status HTTP apropriado.
   */
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

  /**
   * Atualiza dados básicos do usuário (name, state_code, preferences).
   * Só o próprio usuário autenticado pode atualizar seu registro;
   * responde 403 se o ID autenticado difere do ID da rota.
   * @param {import("express").Request} req
   * @param {import("express").Response} res
   * @returns {Promise<void>} Responde com JSON e status HTTP apropriado.
   */
  async updateUser(req, res) {
    try {
      const repo = AppDataSource.getRepository(UserEntity);
      const { id } = req.params;

      if (req.user.id !== parseInt(id)) {
        return res.status(403).json({
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

  /**
   * Remove um usuário pelo ID.
   * Após remover, apaga de forma assíncrona o blob do avatar antigo
   * (falha na limpeza não afeta a resposta).
   * @param {import("express").Request} req
   * @param {import("express").Response} res
   * @returns {Promise<void>} Responde com JSON e status HTTP apropriado.
   */
  async deleteUser(req, res) {
    const repo = AppDataSource.getRepository(UserEntity);

    const { id } = req.params;

    const userToDelete = await repo.findOneBy({ id: parseInt(id) });

    if (!userToDelete) {
      return res.status(404).json({ message: "Usuário não encontrado" });
    }

    const blobAntigo = userToDelete.avatar_blob;

    await repo.remove(userToDelete);

    apagarBlob(blobAntigo).catch((e) =>
      console.error("Falha ao apagar avatar do usuário removido:", e.message),
    );

    return res.status(200).json({ message: "Usuário removido com sucesso" });
  }

  /**
   * Reativa um usuário desativado (active = true).
   * Responde 400 se o usuário já estiver ativo.
   * @param {import("express").Request} req
   * @param {import("express").Response} res
   * @returns {Promise<void>} Responde com JSON e status HTTP apropriado.
   */
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

  /**
   * Desativa um usuário (active = false).
   * Responde 400 se o usuário já estiver desativado.
   * @param {import("express").Request} req
   * @param {import("express").Response} res
   * @returns {Promise<void>} Responde com JSON e status HTTP apropriado.
   */
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

  /**
   * Busca um usuário pelo e-mail.
   * @param {import("express").Request} req
   * @param {import("express").Response} res
   * @returns {Promise<void>} Responde com JSON e status HTTP apropriado.
   */
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

  /**
   * Promove o usuário para o papel de administrador (role = "admin").
   * @param {import("express").Request} req
   * @param {import("express").Response} res
   * @returns {Promise<void>} Responde com JSON e status HTTP apropriado.
   */
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
  /**
   * Rebaixa o usuário para o papel comum (role = "user").
   * @param {import("express").Request} req
   * @param {import("express").Response} res
   * @returns {Promise<void>} Responde com JSON e status HTTP apropriado.
   */
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

  /**
   * Promove o usuário para o papel premium (role = "premium").
   * @param {import("express").Request} req
   * @param {import("express").Response} res
   * @returns {Promise<void>} Responde com JSON e status HTTP apropriado.
   */
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

  /**
   * Consulta o estado premium do usuário.
   * Retorna hasPremium false e plano "free" quando não há assinatura
   * ativa ou quando a data de término já passou.
   * @param {import("express").Request} req
   * @param {import("express").Response} res
   * @returns {Promise<void>} Responde com JSON e status HTTP apropriado.
   */
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

  /**
   * Ativa manualmente o premium do usuário.
   * Cria uma assinatura "premium" ativa com validade de 30 dias a partir
   * da data atual.
   * @param {import("express").Request} req
   * @param {import("express").Response} res
   * @returns {Promise<void>} Responde com JSON e status HTTP apropriado.
   */
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

  /**
   * Desativa manualmente o premium do usuário.
   * Marca a assinatura ativa como "inactive"; responde 404 se não houver
   * assinatura ativa.
   * @param {import("express").Request} req
   * @param {import("express").Response} res
   * @returns {Promise<void>} Responde com JSON e status HTTP apropriado.
   */
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

  /**
   * Solicita a redefinição de senha por e-mail.
   * Invalida tokens de reset anteriores não utilizados, gera um novo token
   * com validade de 2 horas e envia o link por e-mail. Sempre responde 200
   * com mensagem genérica para não revelar se o e-mail existe.
   * @param {import("express").Request} req
   * @param {import("express").Response} res
   * @returns {Promise<void>} Responde com JSON e status HTTP apropriado.
   */
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
  /**
   * Redefine a senha do usuário usando o token de recuperação.
   * Valida presença, uso e expiração do token, grava a nova senha com hash
   * e marca o token como utilizado.
   * @param {import("express").Request} req
   * @param {import("express").Response} res
   * @returns {Promise<void>} Responde com JSON e status HTTP apropriado.
   */
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
  /**
   * Confirma a verificação de e-mail do cadastro.
   * Valida o token EMAIL_VERIFICATION (não usado e não expirado), marca o
   * usuário como e-mail verificado e consome o token.
   * @param {import("express").Request} req
   * @param {import("express").Response} res
   * @returns {Promise<void>} Responde com JSON e status HTTP apropriado.
   */
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
        return res.status(400).json({
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
  /**
   * Inicia a troca de e-mail do usuário autenticado.
   * Exige e-mail e senha (confere a senha atual), valida formato, evita
   * e-mail igual ao atual ou já em uso, grava o pending_email e envia um
   * link de confirmação para o novo e-mail e um aviso para o antigo.
   * @param {import("express").Request} req
   * @param {import("express").Response} res
   * @returns {Promise<void>} Responde com JSON e status HTTP apropriado.
   */
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

      return res.status(200).json({
        message: "Enviamos um link de confirmação para o novo e-mail",
      });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: "Erro interno no servidor" });
    }
  }
  /**
   * Confirma a troca de e-mail pendente usando o token recebido.
   * Valida o token EMAIL_CHANGE (não usado e não expirado) e a existência
   * do pending_email; em transação, promove o novo e-mail (já verificado),
   * limpa o pendente e consome o token. Trata violação de unicidade (409).
   * @param {import("express").Request} req
   * @param {import("express").Response} res
   * @returns {Promise<void>} Responde com JSON e status HTTP apropriado.
   */
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
        return res.status(400).json({
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
  /**
   * Reenvia o e-mail de verificação de cadastro.
   * Responde sempre com mensagem genérica; aplica limite de 1 minuto entre
   * envios (429) e ignora contas já verificadas ou inexistentes.
   * @param {import("express").Request} req
   * @param {import("express").Response} res
   * @returns {Promise<void>} Responde com JSON e status HTTP apropriado.
   */
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
        return res.status(429).json({
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

/**
 * Controller de avatares dos usuários.
 */
export class AvatarController {
    /**
   * Atualiza o avatar do usuário autenticado.
   * Só o próprio usuário pode alterar seu avatar; valida que há arquivo e
   * que é uma imagem real (inspeciona os bytes), envia a nova imagem ao
   * armazenamento, persiste a referência (removendo a nova em caso de falha
   * no banco) e apaga o blob antigo de forma assíncrona.
   * @param {import("express").Request} req
   * @param {import("express").Response} res
   * @returns {Promise<void>} Responde com JSON e status HTTP apropriado.
   */
    async updateAvatar(req, res) {
    try {
      const { id } = req.params;

      if (req.user.id !== parseInt(id)) {
        return res.status(403).json({
          message: "Você não tem permissão para alterar este avatar",
        });
      }

      if (!req.file) {
        return res.status(400).json({ message: "Nenhum arquivo enviado" });
      }

      // Confere os bytes reais do arquivo, não só o mimetype enviado pelo cliente
      const mimeReal = await validarImagem(req.file.buffer);
      if (!mimeReal) {
        return res
          .status(415)
          .json({ message: "Arquivo não é uma imagem válida" });
      }
      req.file.mimetype = mimeReal;

      const repo = AppDataSource.getRepository(UserEntity);
      const user = await repo.findOneBy({ id: parseInt(id) });

      if (!user) {
        return res.status(404).json({ message: "Usuário não encontrado" });
      }

      const blobAntigo = user.avatar_blob;

      // 1) envia a nova imagem
      const { nomeBlob, url } = await enviarAvatar(req.file);

      // 2) salva no banco (se falhar, remove a imagem recém-enviada)
      user.avatar_blob = nomeBlob;
      user.avatar_url = url;
      try {
        await repo.save(user);
      } catch (dbError) {
        await apagarBlob(nomeBlob).catch(() => {});
        throw dbError;
      }

      // 3) só então apaga a antiga
      apagarBlob(blobAntigo).catch((e) =>
        console.error("Falha ao apagar avatar antigo:", e.message)
      );

      return res.status(200).json({
        message: "Avatar atualizado com sucesso",
        avatar_url: url,
      });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: "Erro interno no servidor" });
    }
  }

  /**
   * Remove o avatar do usuário autenticado.
   * Só o próprio usuário pode remover seu avatar; zera avatar_blob e
   * avatar_url e apaga o blob antigo de forma assíncrona.
   * @param {import("express").Request} req
   * @param {import("express").Response} res
   * @returns {Promise<void>} Responde com JSON e status HTTP apropriado.
   */
  async removeAvatar(req, res) {
    try {
      const { id } = req.params;

      if (req.user.id !== parseInt(id)) {
        return res.status(403).json({
          message: "Você não tem permissão para remover este avatar",
        });
      }

      const repo = AppDataSource.getRepository(UserEntity);
      const user = await repo.findOneBy({ id: parseInt(id) });

      if (!user) {
        return res.status(404).json({ message: "Usuário não encontrado" });
      }

      const blobAntigo = user.avatar_blob;

      user.avatar_blob = null;
      user.avatar_url = null;
      await repo.save(user);

      await apagarBlob(blobAntigo).catch((e) =>
        console.error("Falha ao apagar avatar:", e.message)
      );

      return res.status(200).json({ message: "Avatar removido com sucesso" });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: "Erro interno no servidor" });
    }
  }
}