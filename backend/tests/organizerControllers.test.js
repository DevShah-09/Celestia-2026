import test from 'node:test';
import assert from 'node:assert/strict';
import nodemailer from 'nodemailer';
import jwt from 'jsonwebtoken';
import { Participant, Game, Admin } from '../models/index.js';
import { assignPoints, assignPointsByQR, verifyQRCode } from '../controllers/pointsController.js';
import { bulkUpdatePoints } from '../controllers/adminController.js';
import { authenticateAdmin } from '../middleware/auth.js';

function response() {
  return { statusCode: 200, status(code) { this.statusCode = code; return this; }, json(body) { this.body = body; return this; } };
}
function participant() {
  return { teamId: 1000, teamName: 'Star Rangers', leaderName: 'Avery', totalPoints: 35,
    gameProgress: [{ gameId: null, points: -5 }], saves: 0,
    async save() { this.saves++; },
  };
}
const organizer = { adminId: 'admin1', adminName: 'Organizer', adminEmail: 'organizer@example.com' };

test('manual and QR awards succeed after deductions and count game completions', async t => {
  const team = participant();
  t.mock.method(Participant, 'findOne', async () => team);
  t.mock.method(Game, 'findById', async () => ({ _id: 'game1', gameName: 'Maze', gamePoints: 20, isActive: true }));
  for (const [handler, body] of [[assignPoints, { teamId: 1000, gameId: 'game1' }], [assignPointsByQR, { qrData: '{"teamId":1000}', gameId: 'game1' }]]) {
    const res = response();
    await handler({ ...organizer, body }, res);
    assert.equal(res.statusCode, 200);
    assert.equal(res.body.data.timesCompletedThisGame, team.saves);
  }
  assert.equal(team.totalPoints, 75);
  assert.equal(team.saves, 2);
});
test('QR verification tolerates penalty rows and rejects malformed payloads', async t => {
  const team = participant();
  team.gameProgress.push({ gameId: { _id: 'game1', gameName: 'Maze', gamePoints: 20 }, points: 20 });
  t.mock.method(Participant, 'findOne', () => ({ populate: async () => team }));
  const res = response();
  await verifyQRCode({ body: { qrData: '{"teamId":1000}' } }, res);
  assert.equal(res.statusCode, 200);
  assert.equal(res.body.data.totalGamesPlayed, 1);
  assert.equal(res.body.data.recentActivity[1].gameName, 'Points adjustment');
  for (const qrData of ['null', '{}', 'not-json']) {
    const invalid = response();
    await verifyQRCode({ body: { qrData } }, invalid);
    assert.equal(invalid.statusCode, 400);
  }
});
test('bulk scoring returns partial and all-failed results without altering insufficient balances', async t => {
  const team = participant();
  t.mock.method(Participant, 'findOne', async ({ teamId }) => teamId === 1000 ? team : null);
  const res = response();
  await bulkUpdatePoints({ ...organizer, body: { updates: [{ teamId: 1000, scoreToAdd: 10 }, { teamId: 9999, scoreToAdd: 5 }] } }, res);
  assert.equal(res.statusCode, 207);
  assert.equal(res.body.data.successful.length, 1);
  assert.equal(res.body.data.failed[0].reason, 'Team not found');
  const failed = response();
  await bulkUpdatePoints({ ...organizer, body: { updates: [{ teamId: 1000, scoreToAdd: -100 }] } }, failed);
  assert.equal(failed.statusCode, 400);
  assert.equal(failed.body.data.failed.length, 1);
  assert.equal(team.totalPoints, 45);
});
test('admin authorization uses current database role and rejects inactive accounts', async t => {
  const oldSecret = process.env.JWT_SECRET;
  process.env.JWT_SECRET = 'isolated-test-secret';
  t.after(() => { if (oldSecret === undefined) delete process.env.JWT_SECRET; else process.env.JWT_SECRET = oldSecret; });
  let active = true;
  t.mock.method(Admin, 'findById', async () => ({ isActive: active, role: 'admin', name: 'Current name', email: 'organizer@example.com' }));
  const token = jwt.sign({ id: 'admin1', role: 'superadmin', name: 'Old name' }, process.env.JWT_SECRET);
  const req = { headers: { authorization: `Bearer ${token}` } };
  let authorized = false;
  await authenticateAdmin(req, response(), () => { authorized = true; });
  assert.equal(authorized, true);
  assert.equal(req.adminRole, 'admin');
  active = false;
  const res = response();
  await authenticateAdmin(req, res, () => assert.fail('Inactive account accepted'));
  assert.equal(res.statusCode, 401);
});
test('registration returns saved team and downloadable QR when email fails', async t => {
  t.mock.method(nodemailer, 'createTransport', () => ({ sendMail: async () => { throw new Error('Test delivery failure'); } }));
  const { registerParticipant } = await import('../controllers/participantController.js');
  t.mock.method(Participant, 'findOne', async () => null);
  t.mock.method(Participant, 'countDocuments', async () => 0);
  let saved;
  t.mock.method(Participant.prototype, 'save', async function () { saved = this; return this; });
  const res = response();
  await registerParticipant({ body: { teamName: ' New team ', leaderName: ' Avery ', leaderEmail: 'AVERY@example.com', teamSize: 4 } }, res);
  assert.equal(res.statusCode, 201);
  assert.equal(res.body.data.emailSent, false);
  assert.equal(saved.leaderEmail, 'avery@example.com');
  assert.match(res.body.data.qrCode, /^data:image\/png;base64,/);
  assert.equal(res.body.data.teamId, 1000);
});
