import { test } from 'node:test';
import assert from 'node:assert/strict';
import { compareReportValues } from '../lib/report-sorting.ts';

test('numeric rates, seconds, and counts sort numerically with missing values last', () => {
 for (const direction of ['ascending', 'descending']) {
  const values = [null, 1000, 9, 80, 0, null];
  assert.deepEqual(values.toSorted((a, b) => compareReportValues(a, b, direction)),
   direction === 'ascending' ? [0, 9, 80, 1000, null, null] : [1000, 80, 9, 0, null, null]);
  assert.equal(compareReportValues(NaN, 1, direction), 1);
 }
});
test('text uses natural ordering, ISO dates sort chronologically, ties remain stable', () => {
 assert.deepEqual(['mission-10', 'mission-2', null].toSorted((a,b) => compareReportValues(a,b,'ascending')), ['mission-2', 'mission-10', null]);
 assert.deepEqual(['2026-09-01', '2025-12-01'].toSorted((a,b) => compareReportValues(a,b,'descending')), ['2026-09-01', '2025-12-01']);
 assert(compareReportValues(9, 9, 'descending') === 0);
 assert.equal(compareReportValues(null, null, 'ascending'), 0);
});
