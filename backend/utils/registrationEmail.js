import { Participant } from '../models/index.js';
import { isEmailConfigured, sendRegistrationEmail } from './emailService.js';

// Atomic claim prevents the API and multiple local senders from mailing the same team.
export async function deliverRegistrationEmail(id, { model = Participant, configured = isEmailConfigured, send = sendRegistrationEmail } = {}) {
  if (!configured()) return 'pending';
  const team = await model.findOneAndUpdate(
    { _id: id, emailStatus: { $in: ['pending', 'failed'] } },
    { $set: { emailStatus: 'sending', emailAttemptedAt: new Date() }, $inc: { emailAttempts: 1 } },
    { new: true }
  );
  if (!team) return 'skipped';
  try {
    await send(team.leaderEmail, team.teamName, team.teamId, team.qrCode);
  } catch {
    await model.updateOne({ _id: id, emailStatus: 'sending' }, { $set: { emailStatus: 'failed' } });
    return 'failed';
  }
  // Keep 'sending' if this write fails: delivery may already have happened.
  // Do not automatically retry such uncertain deliveries.
  await model.updateOne({ _id: id, emailStatus: 'sending' }, { $set: { emailStatus: 'sent', emailSentAt: new Date() } });
  return 'sent';
}
