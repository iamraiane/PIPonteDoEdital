import { Resend } from "resend";
import { AppDataSource } from "../../data-source.js";
import { UserTokenEntity } from "../entities/UserToken.js";
import { generateRandomToken } from "./tokenUtils.js";

/** Cliente da API Resend autenticado com a chave RESEND_API_KEY. */
const resend = new Resend(process.env.RESEND_API_KEY);

/** Remetente padrão dos e-mails da plataforma (RESEND_FROM_EMAIL ou o endereço fallback). */
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || "Ponte do Edital <naoresponda@pontedoedital.com.br>";

/**
 * Envia um e-mail de lembrete de prazo de edital favoritado.
 * Usa deadline_date (ou publication_date na ausência dele) para montar a
 * data do prazo e ajusta o assunto conforme os dias restantes (hoje, amanhã ou "Faltam X dias").
 * @param {string} userEmail - E-mail do destinatário.
 * @param {{ title: string, link: string, deadline_date?: Date|string, publication_date: Date|string }} notice - Edital favoritado.
 * @param {number} daysLeft - Dias restantes até o prazo (0 = dia do prazo).
 * @returns {Promise<void>} Promise resolvida após o envio.
 * @throws {Error} Se a API Resend retornar erro no envio.
 */
export async function sendNoticeReminder(userEmail, notice, daysLeft) {
    // Usa deadline_date quando existir; senão a publication_date (mesma regra do job).
    const rawDeadline = notice.deadline_date ?? notice.publication_date;
    let deadlineStr;
    if (rawDeadline instanceof Date) {
        const y = rawDeadline.getFullYear();
        const m = String(rawDeadline.getMonth() + 1).padStart(2, "0");
        const d = String(rawDeadline.getDate()).padStart(2, "0");
        deadlineStr = `${y}-${m}-${d}`;
    } else {
        deadlineStr = String(rawDeadline).slice(0, 10);
    }
    const deadline = deadlineStr.split("-").reverse().join("/");

    let when;
    if (daysLeft === 0) when = "O prazo termina hoje";
    else if (daysLeft === 1) when = "O prazo termina amanhã";
    else when = `Faltam ${daysLeft} dias para o prazo`;

    const subject = daysLeft === 0
        ? `Hoje é o prazo: ${notice.title}`
        : `${when}: ${notice.title}`;

    const { error } = await resend.emails.send({
        from: FROM_EMAIL,
        to: userEmail,
        subject,
        html: `
            <p>Olá!</p>
            <p>${when} da publicação <strong>${notice.title}</strong>, que você favoritou (prazo: ${deadline}).</p>
            <p><a href="${notice.link}">Ver publicação</a></p>
            <p>Você pode escolher quais avisos receber nas configurações da sua conta.</p>
        `,
    });

    if (error) {
        throw new Error(`Falha ao enviar e-mail de lembrete: ${error.message}`);
    }
}

/**
 * Envia o e-mail de recuperação de senha com o link de redefinição.
 * O link aponta para /reset-password?token=... no frontend e é válido por 2 horas.
 * @param {string} userEmail - E-mail do usuário que solicitou a redefinição.
 * @param {string} token - Token de redefinição gerado para o usuário.
 * @returns {Promise<void>} Promise resolvida após o envio.
 * @throws {Error} Se a API Resend retornar erro no envio.
 */
export async function sendForgotPasswordEmail(userEmail, token) {
    const resetUrl = `${process.env.FRONTEND_URL || "http://localhost:3000"}/reset-password?token=${token}`;

    const { error } = await resend.emails.send({
        from: FROM_EMAIL,
        to: userEmail,
        subject: "Recuperação de Senha",
        html: `
            <p>Olá,</p>
            <p>Você solicitou a recuperação da sua senha.</p>
            <p>Clique no link abaixo para cadastrar uma nova senha (válido por 2 horas):</p>
            <p><a href="${resetUrl}">Redefinir Senha</a></p>
            <p>Se você não solicitou a alteração, ignore este e-mail.</p>
        `,
    });

    if (error) {
        throw new Error(`Falha ao enviar e-mail de recuperação: ${error.message}`);
    }
}

/**
 * Envia o e-mail de verificação de conta com o link de confirmação.
 * O link aponta para /verify-email?token=... no frontend.
 * @param {string} userEmail - E-mail recém-cadastrado a ser verificado.
 * @param {string} token - Token de verificação de e-mail.
 * @returns {Promise<void>} Promise resolvida após o envio.
 * @throws {Error} Se a API Resend retornar erro no envio.
 */
export async function sendEmailVerificationEmail(userEmail, token) {
    const verificationUrl = `${process.env.FRONTEND_URL || "http://localhost:3000"}/verify-email?token=${token}`;
    const { error } = await resend.emails.send({
        from: FROM_EMAIL,
        to: userEmail,
        subject: "Verificação de E-mail",
        html: `
            <p>Olá,</p>
            <p>Obrigado por se registrar. Por favor, verifique seu e-mail clicando no link abaixo:</p>
            <p><a href="${verificationUrl}">Verificar E-mail</a></p>
            <p>Se você não se registrou, ignore este e-mail.</p>
        `,
    });

    if (error) {
        throw new Error(`Falha ao enviar e-mail de verificação: ${error.message}`);
    }
}
/**
 * Cria um novo token de verificação de e-mail para o usuário.
 * Marca como usados os tokens de EMAIL_VERIFICATION ainda ativos do usuário,
 * gera um token aleatório com validade de 24 horas e persiste na tabela user_tokens.
 * @param {number|string} userId - Id do usuário dono do token.
 * @returns {Promise<object>} Registro do token criado (UserToken).
 */
export async function createEmailVerificationToken(userId) {
    const tokenRepo = AppDataSource.getRepository(UserTokenEntity);

    await tokenRepo.update(
        { user_id: userId, type: "EMAIL_VERIFICATION", used: false },
        { used: true }
    );

    const token = generateRandomToken();
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24);

    const newToken = tokenRepo.create({
        token,
        type: "EMAIL_VERIFICATION",
        user_id: userId,
        expires_at: expiresAt,
        used: false,
    });

    return tokenRepo.save(newToken);
}

/**
 * Envia o e-mail de confirmação da troca de endereço para o NOVO e-mail.
 * O link aponta para /confirm-email-change?token=... no frontend (válido por 24 horas).
 * @param {string} newEmail - Novo endereço de e-mail a ser confirmado.
 * @param {string} token - Token de troca de e-mail.
 * @returns {Promise<void>} Promise resolvida após o envio.
 * @throws {Error} Se a API Resend retornar erro no envio.
 */
export async function sendEmailChangeEmail(newEmail, token) {
    const confirmUrl = `${process.env.FRONTEND_URL || "http://localhost:3000"}/confirm-email-change?token=${token}`;

    const { error } = await resend.emails.send({
        from: FROM_EMAIL,
        to: newEmail,
        subject: "Confirme seu novo e-mail",
        html: `
            <p>Olá,</p>
            <p>Recebemos um pedido para usar este endereço na sua conta. Confirme clicando no link abaixo (válido por 24 horas):</p>
            <p><a href="${confirmUrl}">Confirmar novo e-mail</a></p>
            <p>Se você não fez essa solicitação, ignore este e-mail.</p>
        `,
    });

    if (error) {
        throw new Error(`Falha ao enviar e-mail de troca de e-mail: ${error.message}`);
    }
}

/**
 * Envia um aviso de segurança ao e-mail ANTIGO informando que houve
 * solicitação de troca de endereço (sem link de confirmação).
 * @param {string} oldEmail - Endereço de e-mail atual do usuário.
 * @returns {Promise<void>} Promise resolvida após o envio.
 * @throws {Error} Se a API Resend retornar erro no envio.
 */
export async function sendEmailChangeNoticeToOldEmail(oldEmail) {
    const { error } = await resend.emails.send({
        from: FROM_EMAIL,
        to: oldEmail,
        subject: "Solicitação de troca de e-mail",
        html: `
            <p>Olá,</p>
            <p>Alguém solicitou a troca do e-mail da sua conta. Se foi você, basta confirmar pelo link enviado ao novo endereço.</p>
            <p>Se não foi você, altere sua senha imediatamente.</p>
        `,
    });

    if (error) {
        throw new Error(`Falha ao enviar aviso ao e-mail antigo: ${error.message}`);
    }
}

/**
 * Cria um novo token de troca de e-mail para o usuário.
 * Marca como usados os tokens de EMAIL_CHANGE ainda ativos do usuário,
 * gera um token aleatório com validade de 24 horas e persiste na tabela user_tokens.
 * @param {number|string} userId - Id do usuário dono do token.
 * @returns {Promise<object>} Registro do token criado (UserToken).
 */
export async function createEmailChangeToken(userId) {
    const tokenRepo = AppDataSource.getRepository(UserTokenEntity);

    await tokenRepo.update(
        { user_id: userId, type: "EMAIL_CHANGE", used: false },
        { used: true }
    );

    const token = generateRandomToken();
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24);

    const newToken = tokenRepo.create({
        token,
        type: "EMAIL_CHANGE",
        user_id: userId,
        expires_at: expiresAt,
        used: false,
    });

    return tokenRepo.save(newToken);
}

/**
 * Compara dois e-mails ignorando espaços nas pontas e diferenças de maiúsculas/minúsculas.
 * @param {string} emailNovo - Novo e-mail informado.
 * @param {string} emailAntigo - E-mail atual/armazenado.
 * @returns {boolean} true se os dois e-mails forem equivalentes.
 */
export function emailIsEqual(emailNovo, emailAntigo) {
    return emailNovo.trim().toLowerCase() === emailAntigo.trim().toLowerCase();
}