import bcrypt from 'bcryptjs';

/** Número de salt rounds usado pelo bcrypt (custo de hashing). */
const saltRounds = 10;

/**
 * Gera o hash de uma senha em texto puro usando bcrypt.
 * @param {string} password - Senha em texto puro.
 * @returns {Promise<string>} Hash da senha pronto para persistir.
 */
export const hashPassword = async (password) => {
  const salt = await bcrypt.genSalt(saltRounds);
  return await bcrypt.hash(password, salt);
};

/**
 * Compara uma senha em texto puro com um hash armazenado.
 * @param {string} password - Senha em texto puro informada pelo usuário.
 * @param {string} hashedPassword - Hash salvo no banco.
 * @returns {Promise<boolean>} true se a senha corresponder ao hash.
 */
export const comparePassword = async (password, hashedPassword) => {
  return await bcrypt.compare(password, hashedPassword);
};