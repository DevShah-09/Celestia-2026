import test from 'node:test';
import assert from 'node:assert/strict';
import { Participant } from '../models/index.js';
import { settleBulkBets, validateBets } from '../controllers/bulkBettingController.js';
import { getLeaderboard } from '../controllers/participantController.js';
const response = () => ({ statusCode: 200, status(n) { this.statusCode = n; return this; }, json(body) { this.body = body; return this; } });
const bet = (teamId = 1001, pointsBet = 50, multiplier = 2) => ({ teamId, pointsBet, multiplier, operationId: 'bet-operation-id-' + teamId });
async function call(bets) { const res = response(); await settleBulkBets({ body: { bets }, adminId: '507f1f77bcf86cd799439011', adminName: 'Organizer' }, res); return res; }
function setup(t) {
  const teams = [1001, 1002, 1003].map(teamId => new Participant({ teamId, teamName: 'Team ' + teamId, totalPoints: 100, leaderName: 'Leader', leaderEmail: teamId + '@example.com', qrCode: 'qr' }));
  t.mock.method(Participant, 'findOneAndUpdate', async (filter, update, options) => {
    assert.equal(options.new, true);
    assert.equal(update.$push.gameProgress.$each.length, 2);
    assert.equal(update.$push.gameProgress.$each.reduce((sum, entry) => sum + entry.points, 0), update.$inc.totalPoints);
    assert.equal(filter['activeGamblingGame.gameId'], null);
    assert.deepEqual(filter.pointsBet, { $not: { $gt: 0 } });
    const team = teams.find(team => team.teamId === filter.teamId);
    if (!team || team.pointsBet > 0 || team.totalPoints < filter.totalPoints.$gte || team.totalPoints > filter.totalPoints.$lte || team.gameProgress.some(entry => entry.operationId === filter['gameProgress.operationId'].$ne)) return null;
    team.totalPoints += update.$inc.totalPoints;
    team.gameProgress.push(...update.$push.gameProgress.$each);
    await team.validate();
    return team;
  });
  t.mock.method(Participant, 'findOne', async ({ teamId }) => teams.find(team => team.teamId === teamId));
  return teams;
}
test('bulk betting deducts 50 and adds 100 at 2x; losses and fractions update the leaderboard', async t => {
  const teams = setup(t);
  const res = await call([bet(), bet(1002, 50, 0), bet(1003, 51, 0.5)]);
  assert.equal(res.statusCode, 200);
  assert.deepEqual(teams.map(team => team.totalPoints), [150, 50, 74]);
  assert.deepEqual(teams[0].gameProgress.map(entry => entry.points), [-50, 100]);
  assert.equal(teams[0].gameProgress[0].operationId, bet().operationId);
  t.mock.method(Participant, 'find', () => ({ select() { return this; }, async sort(sort) { assert.deepEqual(sort, { totalPoints: -1 }); return [...teams].sort((a,b) => b.totalPoints - a.totalPoints); } }));
  const leaderboard = response(); await getLeaderboard({}, leaderboard);
  assert.deepEqual(leaderboard.body.data.map(team => team.teamId), [1001, 1003, 1002]);
});
test('retries apply each bet once, and changed payloads cannot reuse an operation ID', async t => {
  const teams = setup(t);
  await call([bet()]);
  const retry = await call([bet()]);
  assert.equal(retry.body.data.successful[0].alreadyApplied, true);
  assert.equal(teams[0].totalPoints, 150);
  assert.equal(teams[0].gameProgress.length, 2);
  assert.equal((await call([{ ...bet(), multiplier: 3 }])).statusCode, 400);
  assert.equal(teams[0].totalPoints, 150);
});
test('missing teams and insufficient funds return partial results; active bets cannot be deducted again', async t => {
  const teams = setup(t); teams[2].pointsBet = 10;
  const res = await call([bet(), bet(1002, 101), bet(1003), bet(9999)]);
  assert.equal(res.statusCode, 207);
  assert.equal(res.body.data.successful.length, 1);
  assert.equal(res.body.data.failed.length, 3);
  assert.deepEqual(teams.map(team => team.totalPoints), [150, 100, 100]);
});
test('invalid input is rejected before writes, while zero and decimal multipliers are accepted', () => {
  for (const bets of [[], [bet(), bet()], [{ ...bet(), pointsBet: -1 }], [{ ...bet(), pointsBet: 1.5 }], [{ ...bet(), multiplier: -1 }], [{ ...bet(), multiplier: Infinity }], [{ ...bet(), multiplier: '2' }], [{ ...bet(), multiplier: null }], [{ ...bet(), operationId: '' }]]) assert.ok(validateBets(bets));
  assert.equal(validateBets([bet(1001, 50, 0)]), undefined);
  assert.equal(validateBets([bet(1001, 50, 1.5)]), undefined);
});
