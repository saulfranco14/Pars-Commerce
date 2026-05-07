const ALLOWED_INSTALLMENTS = [2, 3, 4, 6, 9, 12];
const MIN_INSTALLMENT_AMOUNT = 15;

export function buildInstallmentOptions(total: number, max: number): number[] {
  return ALLOWED_INSTALLMENTS.filter(
    (n) => n <= max && total / n >= MIN_INSTALLMENT_AMOUNT,
  );
}
