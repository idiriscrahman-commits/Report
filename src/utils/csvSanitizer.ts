/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Sanitizes a single CSV field value to prevent formula injection (CWE-1236).
 * Formulas starting with =, +, -, @, tab, or carriage return are neutralized by prepending a single quote.
 */
export function sanitizeCsvField(value: unknown): string {
  if (value === null || value === undefined) {
    return '""';
  }

  let str = String(value);

  // Strip or normalize line breaks
  str = str.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

  // Check if first character could be interpreted as a spreadsheet formula trigger
  const dangerousChars = ['=', '+', '-', '@', '\t', '\r', '|'];
  const firstChar = str.charAt(0);

  if (dangerousChars.includes(firstChar)) {
    str = `'${str}`;
  }

  // Escape inner double quotes by doubling them
  const escaped = str.replace(/"/g, '""');
  return `"${escaped}"`;
}

/**
 * Converts an array of objects into a secure, injection-safe CSV string.
 */
export function generateSafeCsv<T extends Record<string, unknown>>(
  data: T[],
  columns: { key: keyof T; label: string }[]
): string {
  const headerRow = columns.map((col) => sanitizeCsvField(col.label)).join(',');

  const rows = data.map((row) =>
    columns.map((col) => sanitizeCsvField(row[col.key])).join(',')
  );

  return [headerRow, ...rows].join('\r\n');
}
