export function requiresExpenseBank(mode: string): boolean {
  return mode === "Chèque" || mode === "Virement";
}

export function expenseBankId(mode: string, bankId: string): number | undefined {
  if (!requiresExpenseBank(mode)) return undefined;
  const id = Number(bankId);
  return Number.isSafeInteger(id) && id > 0 ? id : undefined;
}