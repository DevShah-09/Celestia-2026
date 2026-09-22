import 'dotenv/config';
import mongoose from 'mongoose';
import { Participant } from '../models/index.js';
import { isEmailConfigured } from '../utils/emailService.js';
import { deliverRegistrationEmail } from '../utils/registrationEmail.js';

const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
try {
  if (args.some(arg => arg !== '--dry-run')) throw new Error('Usage: npm run emails:send -- [--dry-run]');
  if (!process.env.MONGODB_URI) throw new Error('Set MONGODB_URI to the same database used by the deployed backend.');
  if (!dryRun && !isEmailConfigured()) throw new Error('Set EMAIL_USER and EMAIL_PASS in your local backend/.env.');
  await mongoose.connect(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 10000 });
  const teams = await Participant.find({ emailStatus: { $in: ['pending', 'failed'] } }).select('_id teamId').sort({ createdAt: 1 }).lean();
  console.log(teams.length + ' pending/failed QR emails in database ' + mongoose.connection.name);
  const counts = { sent: 0, failed: 0, skipped: 0 };
  for (const team of teams) {
    if (dryRun) { console.log('Would send QR email for team #' + team.teamId); continue; }
    const status = await deliverRegistrationEmail(team._id);
    counts[status] = (counts[status] || 0) + 1;
    console.log('Team #' + team.teamId + ': ' + status);
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  if (!dryRun) console.log(counts);
  if (counts.failed) process.exitCode = 1;
  const uncertain = await Participant.countDocuments({ emailStatus: 'sending' });
  const historical = await Participant.countDocuments({ emailStatus: { $exists: false } });
  if (uncertain) console.log(uncertain + ' interrupted/active deliveries excluded. Review before retrying; see README.');
  if (historical) console.log(historical + ' historical teams have unknown delivery status and were excluded; see README.');
} catch (error) {
  console.error('Email sender stopped:', error.message);
  process.exitCode = 1;
} finally {
  await mongoose.disconnect();
}
