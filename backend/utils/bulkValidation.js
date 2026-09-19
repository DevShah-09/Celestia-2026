export function validateBulkUpdates(updates) {
  if (!Array.isArray(updates) || updates.length === 0) return 'Updates must be a nonempty array.';
  const seen = new Set();
  for (const update of updates) {
    if (!update || !['number', 'string'].includes(typeof update.teamId) || !['number', 'string'].includes(typeof update.scoreToAdd)) return 'Each update requires a team ID and score change.';
    const teamId = Number(update.teamId);
    const points = Number(update.scoreToAdd);
    if (!Number.isSafeInteger(teamId) || teamId < 1 || !Number.isSafeInteger(points) || points === 0) return 'Team IDs must be positive integers and score changes must be nonzero integers.';
    if (seen.has(teamId)) return 'Each team can appear only once in a batch.';
    if (update.reason !== undefined && (typeof update.reason !== 'string' || update.reason.length > 300)) return 'Reasons must be text of at most 300 characters.';
    seen.add(teamId);
  }
  return null;
}
