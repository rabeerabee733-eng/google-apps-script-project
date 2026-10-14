/** Google Sheets returns display strings; support Arabic digits and grouping. */
export function money(value: unknown, mills = false): string {
  if (value === null || value === undefined || value === '') return '—';
  const normalized = String(value)
    .replace(/[٠-٩]/g, digit => String('٠١٢٣٤٥٦٧٨٩'.indexOf(digit)))
    .replace(/[۰-۹]/g, digit => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(digit)))
    .replace(/[٬,\s]/g, '').replace(/٫/g, '.');
  if (!/^-?\d+(\.\d+)?$/.test(normalized)) return '—';
  const number = Number(normalized) / (mills ? 1000 : 1);
  return Number.isFinite(number) ? `${number.toFixed(mills ? 3 : 2)} د.أ` : '—';
}
