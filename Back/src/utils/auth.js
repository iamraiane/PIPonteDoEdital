import jwt from "jsonwebtoken";

/**
 * Middleware de autenticação por token JWT.
 * Extrai o token do cabeçalho "Authorization: Bearer <token>", valida a
 * assinatura com JWT_SECRET e injeta o payload decodificado em req.user.
 * Responde 401 se o cabeçalho não existir ou se o token for inválido.
 * @param {import("express").Request} req - Requisição contendo o cabeçalho Authorization.
 * @param {import("express").Response} res - Resposta usada para retornar erros 401.
 * @param {import("express").NextFunction} next - Próximo middleware em caso de token válido.
 * @returns {void}
 */
export const authMiddleware = (req, res, next) => {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
        return res.status(401).json({ message: "Token não fornecido" });
    }

    const token = authHeader.split(" ")[1];
    
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        req.user = decoded;

        next();
    } catch (err) {
        return res.status(401).json({ message: "Token inválido" });
    }
};