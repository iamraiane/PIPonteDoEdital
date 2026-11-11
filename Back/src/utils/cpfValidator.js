/**
 * Valida um CPF brasileiro usando o algoritmo oficial dos dígitos verificadores.
 * Remove a máscara, descarta CPFs com menos de 11 dígitos ou com todos os
 * dígitos repetidos e confere os dois dígitos verificadores.
 * @param {string} cpf - CPF com ou sem máscara (pontos e hífen).
 * @returns {boolean} true se o CPF for válido; false caso contrário.
 */
export function validateCPF(cpf) {
    
    cpf = cpf.replace(/[^\d]/g, '');

    if (cpf.length !== 11) return false;

    if (/^(\d)\1{10}$/.test(cpf)) return false;

    let soma = 0;
    for (let i = 0; i < 9; i++) {
        soma += parseInt(cpf.charAt(i)) * (10 - i);
    }
    let resto = (soma * 10) % 11;
    if (resto === 10 || resto === 11) resto = 0;
    if (resto !== parseInt(cpf.charAt(9))) return false;

    soma = 0;
    for (let i = 0; i < 10; i++) {
        soma += parseInt(cpf.charAt(i)) * (11 - i);
    }
    resto = (soma * 10) % 11;
    if (resto === 10 || resto === 11) resto = 0;
    if (resto !== parseInt(cpf.charAt(10))) return false;

    return true;
}