/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Generates a unique reference ID for reports in the format:
 * [PREFIX]-[YEAR]-[SEQUENCE]
 * Example: REP-2026-0042
 */
export function generateReferenceId(prefix: string = 'REP', year: number = new Date().getFullYear(), sequence: number = 1): string {
  const cleanPrefix = (prefix || 'REP').trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
  const cleanYear = Math.max(2000, Math.min(2100, Math.floor(year)));
  const cleanSeq = Math.max(1, Math.floor(sequence));
  const paddedSeq = String(cleanSeq).padStart(4, '0');
  return `${cleanPrefix}-${cleanYear}-${paddedSeq}`;
}

/**
 * Validates whether a given string is a valid SRMS reference ID.
 */
export function isValidReferenceId(id: string): boolean {
  if (!id || typeof id !== 'string') return false;
  // Matches patterns like REP-2026-0001, SRMS-2026-99999
  const pattern = /^[A-Z0-9]{2,10}-\d{4}-\d{4,6}$/;
  return pattern.test(id.trim());
}

/**
 * Parses the components of a reference ID.
 */
export function parseReferenceId(id: string): { prefix: string; year: number; sequence: number } | null {
  if (!isValidReferenceId(id)) return null;
  const parts = id.trim().split('-');
  return {
    prefix: parts[0],
    year: parseInt(parts[1], 10),
    sequence: parseInt(parts[2], 10),
  };
}
