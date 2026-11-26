import { Resend } from "resend";
import { AppDataSource } from "../../data-source.js";
import { UserTokenEntity } from "../entities/UserToken.js";
import { generateRandomToken } from "./tokenUtils.js";

/** Cliente da API Resend autenticado com a chave RESEND_API_KEY. */
const resend = new Resend(process.env.RESEND_API_KEY);

/** Remetente padrão dos e-mails da plataforma (RESEND_FROM_EMAIL ou o endereço fallback). */
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || "Ponte do Edital <naoresponda@pontedoedital.com.br>";

// ---------- Identidade visual dos e-mails (altere só aqui) ----------

/** URL pública da logo exibida no cabeçalho dos e-mails. */
const LOGO_URL = "https://www.pontedoedital.com.br/assets/logo-ponte-p25uA1Xk.png";

/** Azul-marinho do cabeçalho e dos títulos (combina com o fundo da logo). */
const COR_FUNDO_CABECALHO = "#0b2a3d";

/** Verde-água usado em botões e detalhes. */
const COR_PRINCIPAL = "#2bbfa4";

/** Verde mais escuro, usado em links sobre fundo branco (melhor contraste). */
const COR_PRINCIPAL_ESCURA = "#1f9c86";

/** Cor do texto dos botões. */
const COR_TEXTO_BOTAO = "#0b2a3d";

/**
 * Escapa caracteres especiais de HTML para inserir texto externo com segurança no e-mail.
 * @param {*} text - Texto a ser escapado.
 * @returns {string} Texto seguro para uso dentro de HTML.
 */
function escapeHtml(text) {
    return String(text ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;");
}

/**
 * Monta o HTML padrão dos e-mails da plataforma (cabeçalho com logo, conteúdo, botão opcional e rodapé).
 * O botão (e o link alternativo) só aparece quando botaoUrl é informado.
 * @param {{ titulo: string, conteudo: string, botaoTexto?: string, botaoUrl?: string }} params
 * @param {string} params.titulo - Título exibido no topo do conteúdo.
 * @param {string} params.conteudo - HTML do corpo do e-mail.
 * @param {string} [params.botaoTexto] - Texto do botão de ação.
 * @param {string} [params.botaoUrl] - Link do botão de ação.
 * @returns {string} HTML completo do e-mail.
 */
export function emailLayout({ titulo, conteudo, botaoTexto, botaoUrl }) {
    const botao = botaoUrl
        ? `
        <tr>
            <td align="center" style="padding:0 32px 24px 32px;">
                <a href="${botaoUrl}"
                   style="display:inline-block; padding:14px 32px; background-color:${COR_PRINCIPAL}; color:${COR_TEXTO_BOTAO}; text-decoration:none; font-weight:bold; border-radius:6px;">
                    ${botaoTexto}
                </a>
            </td>
        </tr>
        <tr>
            <td style="padding:0 32px 24px 32px; color:#777777; font-size:13px; line-height:1.5;">
                Se o botão não funcionar, copie e cole este link no navegador:<br />
                <a href="${botaoUrl}" style="color:${COR_PRINCIPAL_ESCURA}; word-break:break-all;">${botaoUrl}</a>
            </td>
        </tr>`
        : "";

    return `
    <!DOCTYPE html>
    <html lang="pt-BR">
    <body style="margin:0; padding:0; background-color:#f4f6f8; font-family:Arial, Helvetica, sans-serif;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f6f8; padding:24px 0;">
            <tr>
                <td align="center">
                    <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="max-width:560px; width:100%; background-color:#ffffff; border-radius:8px; overflow:hidden;">
                        <tr>
                            <td align="center" bgcolor="${COR_FUNDO_CABECALHO}" style="padding:28px 24px; background-color:${COR_FUNDO_CABECALHO}; border-bottom:4px solid ${COR_PRINCIPAL};">
                                <img src="${LOGO_URL}" alt="Ponte do Edital" width="200" style="display:block; height:auto; border:0;" />
                            </td>
                        </tr>
                        <tr>
                            <td style="padding:32px 32px 16px 32px; color:#333333; font-size:16px; line-height:1.6;">
                                <h2 style="margin:0 0 16px 0; color:${COR_FUNDO_CABECALHO};">${titulo}</h2>
                                ${conteudo}
                            </td>
                        </tr>
                        ${botao}
                        <tr>
                            <td style="padding:20px 32px; background-color:#f9fafb; color:#999999; font-size:12px; text-align:center;">
                                © ${new Date().getFullYear()} Ponte do Edital
                            </td>
                        </tr>
                    </table>
                </td>
            </tr>
        </table>
    </body>
    </html>`;
}

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
        html: emailLayout({
            titulo: when,
            conteudo: `
                <p style="margin:0 0 12px 0;">Olá!</p>
                <p style="margin:0 0 12px 0;">${when} da publicação <strong>${escapeHtml(notice.title)}</strong>, que você favoritou.</p>
                <p style="margin:0 0 24px 0;"><strong>Prazo:</strong> ${deadline}</p>
                <p style="margin:0 0 24px 0; color:#777777; font-size:14px;">Você pode escolher quais avisos receber nas configurações da sua conta.</p>
            `,
            botaoTexto: "Ver publicação",
            botaoUrl: notice.link,
        }),
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
        html: emailLayout({
            titulo: "Recuperação de senha",
            conteudo: `
                <p style="margin:0 0 12px 0;">Olá,</p>
                <p style="margin:0 0 12px 0;">Você solicitou a recuperação da sua senha. Clique no botão abaixo para cadastrar uma nova senha (válido por 2 horas).</p>
                <p style="margin:0 0 24px 0; color:#777777; font-size:14px;">Se você não solicitou a alteração, ignore este e-mail.</p>
            `,
            botaoTexto: "Redefinir senha",
            botaoUrl: resetUrl,
        }),
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
        html: emailLayout({
            titulo: "Verifique seu e-mail",
            conteudo: `
                <p style="margin:0 0 12px 0;">Olá,</p>
                <p style="margin:0 0 12px 0;">Obrigado por se registrar no Ponte do Edital. Para ativar sua conta, confirme seu e-mail clicando no botão abaixo.</p>
                <p style="margin:0 0 24px 0; color:#777777; font-size:14px;">Se você não se registrou, ignore este e-mail.</p>
            `,
            botaoTexto: "Verificar e-mail",
            botaoUrl: verificationUrl,
        }),
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
        html: emailLayout({
            titulo: "Confirme seu novo e-mail",
            conteudo: `
                <p style="margin:0 0 12px 0;">Olá,</p>
                <p style="margin:0 0 12px 0;">Recebemos um pedido para usar este endereço na sua conta do Ponte do Edital. Confirme clicando no botão abaixo (válido por 24 horas).</p>
                <p style="margin:0 0 24px 0; color:#777777; font-size:14px;">Se você não fez essa solicitação, ignore este e-mail.</p>
            `,
            botaoTexto: "Confirmar novo e-mail",
            botaoUrl: confirmUrl,
        }),
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
        html: emailLayout({
            titulo: "Solicitação de troca de e-mail",
            conteudo: `
                <p style="margin:0 0 12px 0;">Olá,</p>
                <p style="margin:0 0 12px 0;">Alguém solicitou a troca do e-mail da sua conta no Ponte do Edital. Se foi você, basta confirmar pelo link enviado ao novo endereço.</p>
                <p style="margin:0 0 24px 0; padding:12px 16px; background-color:#fff4e5; border-left:4px solid #f5a623; color:#7a4b00; font-size:14px;">
                    <strong>Não foi você?</strong> Altere sua senha imediatamente para proteger sua conta.
                </p>
            `,
        }),
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