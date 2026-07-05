// Normalizes a phone number to a consistent digit-only form so phone-based
// identity lookups (the storefront has no login system — phone number
// doubles as the customer's identity for checkout, order tracking, and
// subscription self-service) aren't defeated by spaces, dashes, parens, or
// a +84/84 country-code prefix a customer might type one time and not
// another. e.g. "+84 987-654 321" and "0987654321" both normalize to
// "0987654321".
export function normalizePhone(raw: string): string {
  const digits = raw.replace(/\D/g, "");
  if (digits.startsWith("84") && digits.length > 9) {
    return "0" + digits.slice(2);
  }
  return digits;
}
