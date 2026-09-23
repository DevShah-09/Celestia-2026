import { Participant } from '../models/index.js';
import { formatResponse, handleError } from '../utils/helpers.js';

export function validateBets(bets) {
  if (!Array.isArray(bets) || bets.length < 1 || bets.length > 100) return 'Enter between 1 and 100 bets.';
  const teams = new Set();
  for (const bet of bets) {
    if (!bet || !Number.isSafeInteger(bet.teamId) || bet.teamId < 1) return 'Team IDs must be positive whole numbers.';
    if (teams.has(bet.teamId)) return 'Each team can appear only once per batch.';
    teams.add(bet.teamId);
    if (!Number.isSafeInteger(bet.pointsBet) || bet.pointsBet <= 0) return 'Bet amounts must be positive whole numbers.';
    if (typeof bet.multiplier !== 'number' || !Number.isFinite(bet.multiplier) || bet.multiplier < 0) return 'Multipliers must be finite numbers greater than or equal to zero.';
    if (!Number.isSafeInteger(Math.floor(bet.pointsBet * bet.multiplier))) return 'Payout is too large.';
    if (typeof bet.operationId !== 'string' || !/^[a-zA-Z0-9-]{16,80}$/.test(bet.operationId)) return 'A valid operation ID is required for each bet.';
  }
}

export const settleBulkBets = async (req, res) => {
  try {
    const { bets } = req.body;
    const invalid = validateBets(bets);
    if (invalid) return res.status(400).json(formatResponse(null, invalid, 400));
    const successful = [], failed = [];
    for (const bet of bets) {
      const { teamId, pointsBet, multiplier, operationId } = bet;
      const payout = Math.floor(pointsBet * multiplier);
      const netChange = payout - pointsBet;
      const assignedBy = { adminId: req.adminId, adminName: req.adminName, adminEmail: req.adminEmail };
      const entry = { gameId: null, operationId, pointsBet, multiplier, assignedBy, completedAt: new Date() };
      // Both ledger entries and the balance change commit in one document update.
      // The operation ID makes a network retry safe, including concurrent retries.
      const team = await Participant.findOneAndUpdate({
        teamId,
        totalPoints: { $gte: pointsBet, $lte: Number.MAX_SAFE_INTEGER - Math.max(0, netChange) },
        'gameProgress.operationId': { $ne: operationId },
        'activeGamblingGame.gameId': null,
        pointsBet: { $not: { $gt: 0 } },
      }, {
        $inc: { totalPoints: netChange },
        $push: { gameProgress: { $each: [
          { ...entry, bettingAction: 'stake', points: -pointsBet, penalty: { isDeduction: true, reason: 'Bet stake: ' + pointsBet + ' points at ' + multiplier + '×' } },
          { ...entry, bettingAction: 'payout', points: payout, penalty: { isDeduction: false, reason: 'Bet payout: ' + pointsBet + ' × ' + multiplier + ' = ' + payout } },
        ] } },
      }, { new: true, runValidators: true });
      if (team) {
        successful.push({ teamId, teamName: team.teamName, pointsBet, multiplier, payout, netChange, previousPoints: team.totalPoints - netChange, totalPoints: team.totalPoints });
        continue;
      }
      const existing = await Participant.findOne({ teamId });
      const prior = existing?.gameProgress.find(item => item.operationId === operationId && item.bettingAction === 'stake');
      if (prior && prior.pointsBet === pointsBet && prior.multiplier === multiplier) {
        successful.push({ teamId, teamName: existing.teamName, pointsBet, multiplier, payout, netChange, totalPoints: existing.totalPoints, alreadyApplied: true });
      } else failed.push({ teamId, reason: !existing ? 'Team not found' : prior ? 'This operation ID was already used for a different bet.' : existing.pointsBet > 0 || existing.activeGamblingGame?.gameId ? 'Finish or cancel the existing active bet first.' : existing.totalPoints < pointsBet ? 'Insufficient points to cover the bet. Available: ' + existing.totalPoints : 'Balance exceeds the supported range.' });
    }
    const status = failed.length ? (successful.length ? 207 : 400) : 200;
    return res.status(status).json(formatResponse({ successful, failed }, 'Betting results processed', status));
  } catch (error) { handleError(error, res); }
};
