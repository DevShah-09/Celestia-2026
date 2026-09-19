import test from 'node:test';
import assert from 'node:assert/strict';
import { Participant, Admin, Game } from '../models/index.js';
import { getAdminPointsHistory, subtractPointsByQR, subtractPointsByTeamId, deactivateAdmin } from '../controllers/adminController.js';
import { updateGame } from '../controllers/gameController.js';
import { requireSuperAdmin } from '../middleware/auth.js';
const response = () => ({ statusCode: 200, status(code) { this.statusCode = code; return this; }, json(body) { this.body = body; return this; } });

test('history retains deductions and deleted games without counting them as games', async t => {
  t.mock.method(Participant, 'find', () => ({ populate() { return this; }, select: async () => [{ teamId: 1000, teamName: 'Test', gameProgress: [
    { gameId: { _id: 'g1', gameName: 'Maze', gamePoints: 20 }, points: 20, assignedBy: { adminName: '__proto__' } },
    { gameId: null, points: -5, penalty: { reason: 'Penalty' } },
    { gameId: null, points: 10 },
  ] }] }));
  const res = response(); await getAdminPointsHistory({}, res);
  assert.equal(res.statusCode, 200);
  const data = res.body.data;
  assert.equal(data.pointsHistory.length, 3);
  assert.equal(data.pointsHistory.find(row => row.pointsAwarded === -5).reason, 'Penalty');
  assert.equal(data.summary.totalPointsAssigned, 25);
  assert.equal(data.summary.uniqueGames, 1);
  assert.equal(data.statistics.byTeam[0].totalGamesCompleted, 1);
});

test('deductions reject invalid amounts and preserve insufficient balances', async t => {
  const team = { teamId: 1000, teamName: 'Test', totalPoints: 20, gameProgress: [], async save() {} };
  t.mock.method(Participant, 'findOne', async () => team);
  for (const handler of [subtractPointsByQR, subtractPointsByTeamId]) {
    for (const points of [-1, 0, 1.5, '5', 25]) {
      const res = response(); await handler({ body: { teamId: 1000, qrData: '{"teamId":1000}', points } }, res);
      assert.equal(res.statusCode, 400); assert.equal(team.totalPoints, 20); assert.equal(team.gameProgress.length, 0);
    }
    const res = response(); await handler({ body: { teamId: 1000, qrData: '{"teamId":1000}', points: 5, reason: 'Penalty' } }, res);
    assert.equal(res.statusCode, 200);
    assert.equal(team.gameProgress.at(-1).points, -5);
    team.totalPoints = 20; team.gameProgress = [];
  }
});

test('self deactivation does not touch the database', async t => {
  const write = t.mock.method(Admin, 'findByIdAndUpdate', () => { throw new Error('Unexpected write'); });
  const res = response(); await deactivateAdmin({ adminId: 'a1', params: { adminId: 'a1' } }, res);
  assert.equal(res.statusCode, 400); assert.equal(write.mock.callCount(), 0);
});

test('game editing whitelists editable fields and reports duplicate names', async t => {
  t.mock.method(Game, 'findByIdAndUpdate', async (id, update) => {
    assert.equal(update.gameName, 'Maze'); assert.equal(update.isActive, undefined); assert.equal(update.createdBy, undefined);
    const error = new Error('Duplicate'); error.code = 11000; throw error;
  });
  const res = response(); await updateGame({ params: { gameId: 'g1' }, body: { gameName: ' Maze ', gamePoints: 20, isActive: true, createdBy: {} } }, res);
  assert.equal(res.statusCode, 409);
});

test('only superadmins can manage admin accounts', async () => {
  let nextCalled = false;
  const next = () => { nextCalled = true; };
  const regular = response();
  requireSuperAdmin({ adminRole: 'admin' }, regular, next);
  assert.equal(regular.statusCode, 403);
  assert.equal(nextCalled, false);
  const superuser = response();
  requireSuperAdmin({ adminRole: 'superadmin' }, superuser, next);
  assert.equal(superuser.statusCode, 200);
  assert.equal(nextCalled, true);
});
