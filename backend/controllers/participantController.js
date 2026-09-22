import { Participant } from "../models/index.js";
import {
  formatResponse,
  handleError,
  generateTeamId,
  validateEmail,
} from "../utils/helpers.js";
import {
  generateQRCode,
} from "../utils/emailService.js";

import { deliverRegistrationEmail } from '../utils/registrationEmail.js';

export const registerParticipant = async (req, res) => {
  try {
    const teamName = typeof req.body.teamName === 'string' ? req.body.teamName.trim() : '';
    const leaderName = typeof req.body.leaderName === 'string' ? req.body.leaderName.trim() : '';
    const leaderEmail = typeof req.body.leaderEmail === 'string' ? req.body.leaderEmail.trim().toLowerCase() : '';
    const teamSize = Number(req.body.teamSize);

    // Validation
    if (!teamName || !leaderName || !leaderEmail || !Number.isSafeInteger(teamSize) || teamSize < 1) {
      return res
        .status(400)
        .json(formatResponse(null, "All fields are required", 400));
    }

    if (!validateEmail(leaderEmail)) {
      return res
        .status(400)
        .json(formatResponse(null, "Invalid email format", 400));
    }

    // Check if email already exists
    const existingParticipant = await Participant.findOne({ leaderEmail });
    if (existingParticipant) {
      return res
        .status(409)
        .json(formatResponse(null, "Email already registered", 409));
    }

    // Generate unique team ID
    const teamId = await generateTeamId();

    // Generate QR code
    const qrCode = await generateQRCode(teamId);

    // Create participant
    const participant = new Participant({
      leaderName,
      leaderEmail,
      teamName,
      teamId,
      teamSize,
      qrCode,
    });

    await participant.save();

    // The team is already saved: email failure must not invite a duplicate registration.
    let emailStatus = 'pending';
    try { emailStatus = await deliverRegistrationEmail(participant._id); }
    catch { emailStatus = 'unknown'; console.error('Team saved, but email delivery status could not be confirmed:', teamId); }
    const emailSent = emailStatus === 'sent';

    res.status(201).json(
      formatResponse(
        {
          teamId,
          teamName,
          leaderName,
          leaderEmail,
          teamSize,
          qrCode,
          emailSent,
          emailStatus,
        },
        emailSent ? "Registration successful! Check your email for QR code." : "Team registered. Your QR email is awaiting delivery; you can download the QR code now.",
        201
      )
    );
  } catch (error) {
    handleError(error, res);
  }
};

export const getParticipantByTeamId = async (req, res) => {
  try {
    const { teamId } = req.params;

    const participant = await Participant.findOne({ teamId }).populate(
      "gameProgress.gameId",
      "gameName gamePoints"
    );

    if (!participant) {
      return res.status(404).json(formatResponse(null, "Team not found", 404));
    }

    // Get leaderboard position
    const leaderboard = await Participant.find()
      .select("teamId totalPoints")
      .sort({ totalPoints: -1 });

    const leaderboardPosition =
      leaderboard.findIndex((team) => team.teamId === participant.teamId) + 1;
    const totalTeams = leaderboard.length;

    // Add leaderboard position to response
    const participantWithPosition = {
      ...participant.toObject(),
      leaderboardPosition,
      totalTeams,
    };

    res.json(
      formatResponse(
        participantWithPosition,
        "Participant retrieved successfully"
      )
    );
  } catch (error) {
    handleError(error, res);
  }
};

export const getAllParticipants = async (req, res) => {
  try {
    const participants = await Participant.find()
      .populate("gameProgress.gameId", "gameName gamePoints")
      .sort({ totalPoints: -1 });

    res.json(
      formatResponse(participants, "Participants retrieved successfully")
    );
  } catch (error) {
    handleError(error, res);
  }
};

export const getLeaderboard = async (req, res) => {
  try {
    const leaderboard = await Participant.find()
      .select("teamName teamSize pointsBet totalPoints teamId")
      .sort({ totalPoints: -1 });

    res.json(formatResponse(leaderboard, "Leaderboard retrieved successfully"));
  } catch (error) {
    handleError(error, res);
  }
};

export const loginParticipant = async (req, res) => {
  try {
    const { teamName, teamId } = req.body;

    if (!teamName || !teamId) {
      return res
        .status(400)
        .json(formatResponse(null, "Team name and Team ID are required", 400));
    }

    const participant = await Participant.findOne({
      teamName: { $regex: new RegExp(`^${teamName}$`, "i") }, // Case-insensitive match
      teamId: parseInt(teamId),
    }).select("teamId teamName leaderName leaderEmail totalPoints");

    if (!participant) {
      return res
        .status(401)
        .json(formatResponse(null, "Invalid team name or team ID", 401));
    }

    res.json(
      formatResponse(
        {
          teamId: participant.teamId,
          teamName: participant.teamName,
          leaderName: participant.leaderName,
          leaderEmail: participant.leaderEmail,
          totalPoints: participant.totalPoints,
        },
        "Login successful"
      )
    );
  } catch (error) {
    handleError(error, res);
  }
};
