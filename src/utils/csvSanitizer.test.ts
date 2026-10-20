import test from 'node:test';
import assert from 'node:assert/strict';
import { sanitizeCsvField, generateSafeCsv } from './csvSanitizer.ts';

test('sanitizeCsvField escapes dangerous formula triggers with prepended single quote', () => {
  assert.equal(sanitizeCsvField('=SUM(A1:A10)'), '"\'=SUM(A1:A10)"');
  assert.equal(sanitizeCsvField('+12345'), '"\'+12345"');
  assert.equal(sanitizeCsvField('-500'), '"\'-500"');
  assert.equal(sanitizeCsvField('@cmd'), '"\'@cmd"');
  assert.equal(sanitizeCsvField('|pipe'), '"\'|pipe"');
});

test('sanitizeCsvField safely handles standard text and double quotes', () => {
  assert.equal(sanitizeCsvField('Q3 Financial Overview'), '"Q3 Financial Overview"');
  assert.equal(sanitizeCsvField('Note with "quotes" inside'), '"Note with ""quotes"" inside"');
  assert.equal(sanitizeCsvField(null), '""');
  assert.equal(sanitizeCsvField(undefined), '""');
});

test('generateSafeCsv produces proper CSV headers and rows without formula injection', () => {
  const records = [
    { id: 'REP-001', title: 'Normal Report', author: 'Alice' },
    { id: 'REP-002', title: '=HYPERLINK("http://attacker.com")', author: 'Bob' },
  ];

  const columns = [
    { key: 'id' as const, label: 'ID' },
    { key: 'title' as const, label: 'Title' },
    { key: 'author' as const, label: 'Author' },
  ];

  const csv = generateSafeCsv(records, columns);
  assert.ok(csv.includes('"ID","Title","Author"'));
  assert.ok(csv.includes('"REP-001","Normal Report","Alice"'));
  assert.ok(csv.includes('"REP-002","\'=HYPERLINK(""http://attacker.com"")","Bob"'));
});
