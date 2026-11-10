import { Resend } from "resend";
import { AppDataSource } from "../../data-source.js";
import { UserTokenEntity } from "../entities/UserToken.js";
import { generateRandomToken } from "./tokenUtils.js";

const resend = new Resend(process.env.RESEND_API_KEY);

const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || "Ponte do Edital <naoresponda@pontedoedital.com.br>";
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

export function emailIsEqual(emailNovo, emailAntigo) {
    return emailNovo.trim().toLowerCase() === emailAntigo.trim().toLowerCase();
}