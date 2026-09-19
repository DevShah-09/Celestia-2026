export function summarizeTeamProgress(participant) {
  const gameStats = new Map();
  let totalGamesPlayed = 0;
  for (const progress of participant.gameProgress) {
    // Standalone deductions and deleted games have no populated game reference.
    if (!progress.gameId) continue;
    totalGamesPlayed++;
    const gameId = progress.gameId._id.toString();
    if (!gameStats.has(gameId)) gameStats.set(gameId, {
      gameId,
      gameName: progress.gameId.gameName,
      gamePoints: progress.gameId.gamePoints,
      timesCompleted: 0,
      totalPointsEarned: 0,
    });
    const stats = gameStats.get(gameId);
    stats.timesCompleted++;
    stats.totalPointsEarned += progress.points;
  }
  return {
    teamName: participant.teamName,
    leaderName: participant.leaderName,
    totalPoints: participant.totalPoints,
    totalGamesPlayed,
    uniqueGamesCompleted: gameStats.size,
    gameStatistics: [...gameStats.values()],
    gameDetails: participant.gameProgress.map(progress => ({
      gameName: progress.gameId?.gameName || 'Points adjustment',
      reason: progress.penalty?.reason || null,
      points: progress.points,
      completedAt: progress.completedAt,
      assignedBy: progress.assignedBy?.adminName || 'Unknown',
    })),
  };
}
