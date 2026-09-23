import test from 'node:test';
import assert from 'node:assert/strict';
import { Game, Participant } from '../models/index.js';
import { placeAuctionBet, revealAuctionResults, cancelActiveBet } from '../controllers/gamblingController.js';
const response = () => ({ statusCode: 200, status(n) { this.statusCode = n; return this; }, json(data) { this.body = data; return this; } });
const admin = { adminId: '507f1f77bcf86cd799439011', adminName: 'Organizer', adminEmail: 'test@example.com' };
function setup(t, type) {
  const game = new Game({ gameName: 'Round', gamePoints: 1, gameType: type });
  game.save = async () => game;
  const teams = [1, 2, 3, 4].map(teamId => {
    const team = new Participant({ teamId, teamName: 'Team ' + teamId, leaderName: 'Leader', leaderEmail: teamId + '@example.com', qrCode: 'qr', totalPoints: 1000 });
    team.save = async () => { await team.validate(); return team; };
    return team;
  });
  t.mock.method(Game, 'findById', async () => game);
  t.mock.method(Participant, 'findOne', async ({ teamId }) => teams.find(team => team.teamId === teamId));
  t.mock.method(Participant, 'find', async () => teams.filter(team => team.pointsBet > 0));
  return { game, teams };
}
async function call(handler, body) { const res = response(); await handler({ ...admin, body }, res); return res; }
test('auction deducts stakes, pays multipliers, persists fields and prevents repeat settlement', async t => {
  const { game, teams } = setup(t, 'auction');
  for (const team of teams) {
    const res = await call(placeAuctionBet, { gameId: game.id, teamId: team.teamId, cupNumber: team.teamId, pointsBet: 100 });
    assert.equal(res.statusCode, 200); assert.equal(team.totalPoints, 900);
    assert.equal(team.activeGamblingGame.cupNumber, team.teamId);
  }
  const res = await call(revealAuctionResults, { gameId: game.id, cupMultipliers: { 1: 0, 2: 0.5, 3: 1.5, 4: 2, 5: 1, 6: 1 } });
  assert.equal(res.statusCode, 200);
  assert.deepEqual(teams.map(team => team.totalPoints), [900, 950, 1050, 1100]);
  assert.deepEqual(teams.map(team => team.gameProgress[0].multiplier), [0, 0.5, 1.5, 2]);
  assert.ok(teams.every(team => team.pointsBet === 0 && !team.activeGamblingGame.gameId));
  assert.equal(game.auctionConfig.auctionCompleted, true);
  assert.equal((await call(revealAuctionResults, { gameId: game.id, cupMultipliers: { 1: 0, 2: 0.5, 3: 1.5, 4: 2, 5: 1, 6: 1 } })).statusCode, 400);
  assert.deepEqual(teams.map(team => team.totalPoints), [900, 950, 1050, 1100]);
});
test('invalid bets, insufficient balance and duplicate active bets do not deduct points; cancellation refunds once', async t => {
  const { game, teams } = setup(t, 'auction');
  const body = { gameId: game.id, teamId: 1, cupNumber: 1, pointsBet: 100 };
  for (const pointsBet of [-1, 0, 1.5, '100', 1001]) assert.equal((await call(placeAuctionBet, { ...body, pointsBet })).statusCode, 400);
  assert.equal((await call(placeAuctionBet, { ...body, cupNumber: 1.5 })).statusCode, 400);
  assert.equal(teams[0].totalPoints, 1000);
  assert.equal((await call(placeAuctionBet, body)).statusCode, 200);
  assert.equal((await call(placeAuctionBet, body)).statusCode, 400);
  assert.equal(teams[0].totalPoints, 900);
  assert.equal((await call(cancelActiveBet, { teamId: 1 })).statusCode, 200);
  assert.equal(teams[0].totalPoints, 1000);
  assert.equal((await call(cancelActiveBet, { teamId: 1 })).statusCode, 400);
});
test('invalid token mappings and negative multipliers are rejected; fractional payouts round down', async t => {
  const { game, teams } = setup(t, 'auction');
  await call(placeAuctionBet, { gameId: game.id, teamId: 1, cupNumber: 2, pointsBet: 101 });
  for (const cupMultipliers of [{ a: 0, b: 0.5, c: 1.5, d: 2 }, { 1: 0, 2: -1, 3: 1.5, 4: 2, 5: 1, 6: 1 }]) assert.equal((await call(revealAuctionResults, { gameId: game.id, cupMultipliers })).statusCode, 400);
  assert.equal(teams[0].totalPoints, 899);
  await call(revealAuctionResults, { gameId: game.id, cupMultipliers: { 1: 0, 2: 0.5, 3: 1.5, 4: 2, 5: 1, 6: 1 } });
  assert.equal(teams[0].totalPoints, 949);
});

test('custom and repeated multipliers pay correctly, including profits below 1.5x', async t => {
  const { game, teams } = setup(t, 'auction');
  for (const team of teams) await call(placeAuctionBet, { gameId: game.id, teamId: team.teamId, cupNumber: team.teamId, pointsBet: 100 });
  const res = await call(revealAuctionResults, { gameId: game.id, cupMultipliers: { 1: 1.25, 2: 3.75, 3: 3.75, 4: 0, 5: 1, 6: 1 } });
  assert.equal(res.statusCode, 200);
  assert.deepEqual(teams.map(team => team.totalPoints), [1025, 1275, 1275, 900]);
  assert.equal(res.body.data.winners.length, 3);
  assert.equal(teams[0].gameProgress[0].didWin, true);
});
test('invalid or overflowing custom multipliers leave all balances unchanged', async t => {
  const { game, teams } = setup(t, 'auction');
  await call(placeAuctionBet, { gameId: game.id, teamId: 1, cupNumber: 1, pointsBet: 100 });
  for (const value of [null, '', '2', -1, Infinity, Number.MAX_VALUE]) {
    const res = await call(revealAuctionResults, { gameId: game.id, cupMultipliers: { 1: value, 2: 1, 3: 1, 4: 1, 5: 1, 6: 1 } });
    assert.equal(res.statusCode, 400);
    assert.equal(teams[0].totalPoints, 900);
    assert.equal(teams[0].pointsBet, 100);
    assert.equal(game.auctionConfig.auctionCompleted, false);
  }
});

test('tokens 5 and 6 accept bets and custom payouts; token 7 is rejected', async t => {
  const { game, teams } = setup(t, 'auction');
  for (const [teamId, cupNumber] of [[1,5],[2,6]]) assert.equal((await call(placeAuctionBet, { gameId: game.id, teamId, cupNumber, pointsBet: 100 })).statusCode, 200);
  assert.equal((await call(placeAuctionBet, { gameId: game.id, teamId: 3, cupNumber: 7, pointsBet: 100 })).statusCode, 400);
  const missing = await call(revealAuctionResults, { gameId: game.id, cupMultipliers: { 1: 1, 2: 1, 3: 1, 4: 1 } });
  assert.equal(missing.statusCode, 400);
  const res = await call(revealAuctionResults, { gameId: game.id, cupMultipliers: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 2.5, 6: 3 } });
  assert.equal(res.statusCode, 200);
  assert.deepEqual(teams.map(team => team.totalPoints), [1150, 1200, 1000, 1000]);
});
