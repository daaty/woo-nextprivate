/**
 * Utilitários para cálculo de parcelas e juros
 */

// Constantes de configuração - Usando variáveis de ambiente
export const MAX_INSTALLMENTS = process.env.NEXT_PUBLIC_MAX_INSTALLMENTS ? parseInt(process.env.NEXT_PUBLIC_MAX_INSTALLMENTS) : 12;
export const INSTALLMENT_INTEREST_RATE = process.env.NEXT_PUBLIC_INSTALLMENT_INTEREST_RATE ? parseFloat(process.env.NEXT_PUBLIC_INSTALLMENT_INTEREST_RATE) : 1.99;
export const CASH_PAYMENT_DISCOUNT_PERCENT = process.env.NEXT_PUBLIC_CASH_PAYMENT_DISCOUNT ? parseFloat(process.env.NEXT_PUBLIC_CASH_PAYMENT_DISCOUNT) : 8;
export const CASH_PAYMENT_MULTIPLIER = (100 - CASH_PAYMENT_DISCOUNT_PERCENT) / 100;

/**
 * Calcula o valor da parcela com juros compostos
 * @param {number} total - Valor total da compra
 * @param {number} installments - Número de parcelas
 * @returns {number} Valor da parcela mensal
 */
export const calculateInstallmentValue = (total, installments) => {
    const rate = INSTALLMENT_INTEREST_RATE / 100;
    if (rate === 0 || installments === 1) {
        return total / installments;
    }
    const coefficient = (rate * Math.pow(1 + rate, installments)) / (Math.pow(1 + rate, installments) - 1);
    const installmentValue = total * coefficient;
    return installmentValue;
};

/**
 * Calcula o valor total com juros
 * @param {number} total - Valor total da compra
 * @returns {number} Valor total com juros
 */
export const calculateTotalWithInterest = (total) => {
    return calculateInstallmentValue(total) * MAX_INSTALLMENTS;
};
