import test from 'node:test';
import assert from 'node:assert/strict';
import { summarizeTeamProgress } from '../utils/teamProgress.js';

test('progress retains deductions and missing games without counting them as games', () => {
  const gameId = { _id: 'game1', gameName: 'Memory Maze', gamePoints: 20 };
  const result = summarizeTeamProgress({ teamName: 'Star Rangers', leaderName: 'Avery', totalPoints: 35, gameProgress: [
    { gameId, points: 20 }, { gameId, points: 20 },
    { gameId: null, points: -5, penalty: { reason: 'Correction' }, assignedBy: { adminName: 'Organizer' } },
    { points: 0 },
  ] });
  assert.equal(result.totalPoints, 35);
  assert.equal(result.totalGamesPlayed, 2);
  assert.equal(result.uniqueGamesCompleted, 1);
  assert.equal(result.gameStatistics[0].totalPointsEarned, 40);
  assert.equal(result.gameStatistics[0].timesCompleted, 2);
  assert.equal(result.gameDetails.length, 4);
  assert.equal(result.gameDetails[2].reason, 'Correction');
  assert.equal(result.gameDetails[2].points, -5);
  assert.equal(result.gameDetails[2].assignedBy, 'Organizer');
});
test('new teams have empty progress', () => {
  const result = summarizeTeamProgress({ teamName: 'New team', totalPoints: 0, gameProgress: [] });
  assert.equal(result.totalGamesPlayed, 0);
  assert.deepEqual(result.gameStatistics, []);
  assert.deepEqual(result.gameDetails, []);
});
