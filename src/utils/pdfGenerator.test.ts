import test from 'node:test';
import assert from 'node:assert/strict';
import { getPdfFilename } from './pdfGenerator.ts';

test('getPdfFilename creates a clean, safe filename from report reference and title', () => {
  const filename = getPdfFilename({
    referenceId: 'REP-2026-0001',
    title: 'Q3 Enterprise Distributed Database Migration & Latency Benchmark',
    reportingDate: '2026-10-15',
  });
  assert.equal(
    filename,
    'REP-2026-0001_q3-enterprise-distributed-database-migra_20261015.pdf'
  );
});

test('getPdfFilename strips dangerous characters and whitespace', () => {
  const filename = getPdfFilename({
    referenceId: 'REP/2026/099!',
    title: 'Incident Analysis: Gateway & Throttling (P1)*',
    reportingDate: '2026-10-18',
  });
  assert.ok(!filename.includes('/'));
  assert.ok(!filename.includes('*'));
  assert.ok(!filename.includes('!'));
  assert.ok(filename.endsWith('.pdf'));
});

test('getPdfFilename falls back safely on missing title or date', () => {
  const filename = getPdfFilename({
    referenceId: '',
    title: '',
  });
  assert.ok(filename.startsWith('REPORT_'));
  assert.ok(filename.endsWith('.pdf'));
});
