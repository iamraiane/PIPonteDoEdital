import jwt from "jsonwebtoken";

/**
 * Assina um token JWT com os dados básicos do usuário.
 * O payload contém id, username e role; validade de 1 dia.
 * @param {{ id: number|string, username: string, role: string }} user - Usuário autenticado.
 * @returns {string} Token JWT assinado.
 */
export const generateToken = (user) => {
    return jwt.sign(
        {
            id: user.id,
            username: user.username,
            role: user.role,
        },
        process.env.JWT_SECRET,
        { expiresIn: "1d" }
    );
};