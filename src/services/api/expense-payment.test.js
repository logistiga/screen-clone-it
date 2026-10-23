import { describe, expect, test } from "bun:test";
import { expenseBankId, requiresExpenseBank } from "./expense-payment";

describe("expense bank payload", () => {
  test("cheque requires a bank and sends its numeric ID", () => {
    expect(requiresExpenseBank("Chèque")).toBe(true);
    expect(expenseBankId("Chèque", "")).toBeUndefined();
    expect(expenseBankId("Chèque", "7")).toBe(7);
  });
  test("transfer requires a bank", () => {
    expect(requiresExpenseBank("Virement")).toBe(true);
    expect(expenseBankId("Virement", "12")).toBe(12);
  });
  test("cash and mobile money never send a leftover bank selection", () => {
    for (const mode of ["Espèces", "Mobile Money"]) {
      expect(requiresExpenseBank(mode)).toBe(false);
      expect(expenseBankId(mode, "7")).toBeUndefined();
    }
  });
  test("invalid bank identifiers are not sent", () => {
    for (const id of ["0", "-1", "1.5", "bad"]) {
      expect(expenseBankId("Chèque", id)).toBeUndefined();
    }
  });
});