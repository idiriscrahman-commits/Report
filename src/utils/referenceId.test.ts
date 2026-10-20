import test from 'node:test';
import assert from 'node:assert/strict';
import { generateReferenceId, isValidReferenceId, parseReferenceId } from './referenceId.ts';

test('generateReferenceId creates expected zero-padded reference string', () => {
  const ref = generateReferenceId('REP', 2026, 42);
  assert.equal(ref, 'REP-2026-0042');
});

test('generateReferenceId sanitizes unusual prefix', () => {
  const ref = generateReferenceId('srms-dept#1!', 2026, 7);
  assert.equal(ref, 'SRMSDEPT1-2026-0007');
});

test('isValidReferenceId correctly validates format', () => {
  assert.equal(isValidReferenceId('REP-2026-0001'), true);
  assert.equal(isValidReferenceId('SRMS-2026-00999'), true);
  assert.equal(isValidReferenceId('invalid-string'), false);
  assert.equal(isValidReferenceId(''), false);
  assert.equal(isValidReferenceId('REP-26-1'), false);
});

test('parseReferenceId splits into components correctly', () => {
  const parsed = parseReferenceId('AUDIT-2026-0150');
  assert.deepEqual(parsed, {
    prefix: 'AUDIT',
    year: 2026,
    sequence: 150,
  });
});
