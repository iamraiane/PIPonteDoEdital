/**
 * Middleware de autorização por perfil (role).
 * Bloqueia a requisição se o usuário autenticado não tiver nenhum dos perfis permitidos.
 * @param {...string} roles - Perfis aceitos (ex.: "admin", "user", "premium").
 * @returns {import("express").RequestHandler} Middleware que valida o role em req.user.role.
 */
export const checkRole = (...roles) => {
    return (req, res, next) => {
        const user = req.user;

        if (!user) {
            return res.status(401).json({ message: "Não autenticado!" });
        }

        if (!roles.includes(user.role)) {
            return res.status(403).json({ message: "Acesso negado!" });
        }

        next();
    };
};