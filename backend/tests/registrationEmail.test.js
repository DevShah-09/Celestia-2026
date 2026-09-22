import test from 'node:test';
import assert from 'node:assert/strict';
import { deliverRegistrationEmail } from '../utils/registrationEmail.js';
import { Participant } from '../models/index.js';
import { registerParticipant } from '../controllers/participantController.js';

const team = { _id: 'one', leaderEmail: 'team@example.com', teamName: 'Team', teamId: 1000, qrCode: 'saved-qr' };
function store() {
  let status = 'pending';
  return {
    get status() { return status; },
    async findOneAndUpdate(filter, update) {
      assert.deepEqual(filter.emailStatus.$in, ['pending', 'failed']);
      if (!filter.emailStatus.$in.includes(status)) return null;
      status = update.$set.emailStatus;
      return team;
    },
    async updateOne(filter, update) { assert.equal(status, filter.emailStatus); status = update.$set.emailStatus; },
  };
}
test('unconfigured email leaves the saved team pending without SMTP or database writes', async () => {
  const unexpected = () => { throw new Error('Unexpected call'); };
  assert.equal(await deliverRegistrationEmail('one', { configured: () => false, model: { findOneAndUpdate: unexpected }, send: unexpected }), 'pending');
});
test('successful sending uses the stored QR and claims once across concurrent senders', async () => {
  const model = store(); let calls = 0;
  const options = { model, configured: () => true, send: async (...args) => { calls++; assert.deepEqual(args, [team.leaderEmail, team.teamName, team.teamId, team.qrCode]); } };
  const results = await Promise.all([deliverRegistrationEmail('one', options), deliverRegistrationEmail('one', options)]);
  assert.deepEqual(results.sort(), ['sent', 'skipped']);
  assert.equal(calls, 1); assert.equal(model.status, 'sent');
  assert.equal(await deliverRegistrationEmail('one', options), 'skipped');
});
test('SMTP failure remains retryable and later success is recorded', async () => {
  const model = store();
  assert.equal(await deliverRegistrationEmail('one', { model, configured: () => true, send: async () => { throw new Error('SMTP failed'); } }), 'failed');
  assert.equal(model.status, 'failed');
  assert.equal(await deliverRegistrationEmail('one', { model, configured: () => true, send: async () => {} }), 'sent');
});
test('database failure after SMTP does not automatically resend accepted email', async () => {
  const model = store(); model.updateOne = async () => { throw new Error('Database offline'); };
  const options = { model, configured: () => true, send: async () => {} };
  await assert.rejects(deliverRegistrationEmail('one', options), /Database offline/);
  assert.equal(model.status, 'sending');
  assert.equal(await deliverRegistrationEmail('one', options), 'skipped');
});
test('registration without credentials returns 201, pending email and a downloadable QR', async t => {
  const oldUser = process.env.EMAIL_USER; const oldPass = process.env.EMAIL_PASS;
  delete process.env.EMAIL_USER; delete process.env.EMAIL_PASS;
  t.after(() => { if (oldUser === undefined) delete process.env.EMAIL_USER; else process.env.EMAIL_USER = oldUser; if (oldPass === undefined) delete process.env.EMAIL_PASS; else process.env.EMAIL_PASS = oldPass; });
  t.mock.method(Participant, 'findOne', async () => null);
  t.mock.method(Participant, 'countDocuments', async () => 0);
  let saved;
  t.mock.method(Participant.prototype, 'save', async function () { saved = this; return this; });
  const res = { status(code) { this.code = code; return this; }, json(body) { this.body = body; } };
  await registerParticipant({ body: { teamName: 'Team', leaderName: 'Leader', leaderEmail: 'team@example.com', teamSize: 4 } }, res);
  assert.equal(res.code, 201); assert.equal(saved.emailStatus, 'pending');
  assert.equal(res.body.data.emailStatus, 'pending'); assert.equal(res.body.data.emailSent, false);
  assert.match(res.body.data.qrCode, /^data:image\/png;base64,/);
});
