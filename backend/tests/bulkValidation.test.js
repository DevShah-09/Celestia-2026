import test from 'node:test';
import assert from 'node:assert/strict';
import { validateBulkUpdates } from '../utils/bulkValidation.js';
test('bulk changes accept whole-number awards and deductions', () => {
  assert.equal(validateBulkUpdates([{ teamId: 1000, scoreToAdd: 10 }, { teamId: '1001', scoreToAdd: '-5', reason: 'Correction' }]), null);
});
test('bulk changes reject malformed values before any team is updated', () => {
  for (const updates of [null, [], [null], [{ teamId: 1000, scoreToAdd: '10oops' }], [{ teamId: 1000, scoreToAdd: 1.5 }], [{ teamId: 1000, scoreToAdd: 0 }], [{ teamId: 1000, scoreToAdd: true }], [{ teamId: 1000, scoreToAdd: 1 }, { teamId: '1000', scoreToAdd: 2 }]]) assert.ok(validateBulkUpdates(updates));
});
