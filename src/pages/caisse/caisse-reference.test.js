import { expect, test } from "bun:test";
import { descriptionSansReference } from "./caisse-reference.ts";
test("retire la référence en fin", () => expect(descriptionSansReference("Prime Chauffeur - Jean - 94821", "94821")).toBe("Prime Chauffeur - Jean"));
test("garde la description sans référence", () => expect(descriptionSansReference("Achat bureau", null)).toBe("Achat bureau"));
test("ne coupe pas une référence au milieu", () => expect(descriptionSansReference("Réf 12 payée", "12")).toBe("Réf 12 payée"));
