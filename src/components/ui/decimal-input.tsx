import { useState, useEffect, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface DecimalInputProps {
  value: number;
  onChange: (value: number) => void;
  onBlur?: () => void;
  placeholder?: string;
  min?: number;
  disabled?: boolean;
  className?: string;
}

/**
 * A numeric input that keeps the raw string internally,
 * allowing users to type decimal separators (dot or comma)
 * without them being stripped immediately.
 * Only emits parsed numbers to the parent.
 */
export function DecimalInput({
  value,
  onChange,
  onBlur,
  placeholder = "0",
  min,
  disabled,
  className,
}: DecimalInputProps) {
  const [rawValue, setRawValue] = useState<string>(value ? String(value) : "");

  // Sync from parent when value changes externally (e.g. initial data)
  useEffect(() => {
    const currentParsed = parseLocalizedNumber(rawValue);
    if (value !== currentParsed) {
      setRawValue(value ? String(value) : "");
    }
  }, [value]);

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const input = e.target.value;

      // Allow empty, digits, dots, commas, and minus
      if (input !== "" && !/^-?[\d.,]*$/.test(input)) return;

      setRawValue(input);

      // Parse and emit to parent
      const parsed = parseLocalizedNumber(input);
      if (min !== undefined && parsed < min) return;
      onChange(parsed);
    },
    [onChange, min]
  );

  const handleBlur = useCallback(() => {
    // On blur, clean up the displayed value
    const parsed = parseLocalizedNumber(rawValue);
    if (rawValue !== "" && !rawValue.endsWith(".") && !rawValue.endsWith(",")) {
      setRawValue(parsed ? String(parsed) : "");
    }
    onBlur?.();
  }, [rawValue, onBlur]);

  return (
    <Input
      type="text"
      inputMode="decimal"
      placeholder={placeholder}
      value={rawValue}
      onChange={handleChange}
      onBlur={handleBlur}
      disabled={disabled}
      className={cn(className)}
    />
  );
}

function parseLocalizedNumber(value: string): number {
  if (!value || value === "" || value === "-") return 0;

  let str = value.trim();

  // Auto-detect: if comma comes after dot, comma is decimal
  const lastComma = str.lastIndexOf(",");
  const lastDot = str.lastIndexOf(".");

  if (lastComma > lastDot) {
    // Comma is decimal separator (e.g. 1.234,56 or 125,651)
    str = str.replace(/\./g, "");
    str = str.replace(",", ".");
  } else {
    // Dot is decimal separator (e.g. 1,234.56 or 125.651)
    str = str.replace(/,/g, "");
  }

  const parsed = parseFloat(str);
  return isNaN(parsed) ? 0 : parsed;
}
