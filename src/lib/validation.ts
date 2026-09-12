export const NAME_RE = /^[A-Za-z][A-Za-z ]*$/;
export const SCHOLAR_RE = /^\d{5}$/;
export const PHONE_RE = /^\d{10}$/;

export function digitsOnly(value: string, max: number): string {
  return value.replace(/\D/g, "").slice(0, max);
}

export function lettersOnly(value: string): string {
  return value.replace(/[^A-Za-z ]/g, "");
}

export function nameError(value: string, label = "Name"): string | null {
  const v = value.trim();
  if (!v) return `${label} is required.`;
  if (!NAME_RE.test(v)) return `${label} can only contain letters.`;
  return null;
}

export function scholarError(value: string): string | null {
  if (!value.trim()) return "Scholar number is required.";
  if (!SCHOLAR_RE.test(value.trim())) return "Scholar number must be exactly 5 digits.";
  return null;
}

export function phoneError(value: string): string | null {
  if (!value.trim()) return "Phone number is required.";
  if (!PHONE_RE.test(value.trim())) return "Phone number must be exactly 10 digits.";
  return null;
}
