import crypto from "node:crypto";

/**
 * Gera um token aleatório criptograficamente seguro.
 * @returns {string} Token de 64 caracteres em hexadecimal (32 bytes aleatórios).
 */
export const generateRandomToken = () => {
  return crypto.randomBytes(32).toString("hex");
};