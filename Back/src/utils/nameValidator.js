
/**
 * Valida um nome de pessoa: permite apenas letras (com acentos) e espaços.
 * @param {string} name - Nome a ser validado.
 * @returns {boolean} true se o nome contiver somente letras e espaços.
 */
export function validateName(name) {
    const nameRegex = /^[A-Za-zÀ-ÖØ-öø-ÿ\s]+$/;
    return nameRegex.test(name);
}