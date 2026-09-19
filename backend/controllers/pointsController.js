import { Participant, Game } from "../models/index.js";
import { formatResponse, handleError } from "../utils/helpers.js";
import { summarizeTeamProgress } from "../utils/teamProgress.js";

export const assignPoints = async (req, res) => {
  try {
    const { teamId, gameId } = req.body;

    if (!teamId || !gameId) {
      return res
        .status(400)
        .json(formatResponse(null, "Team ID and Game ID are required", 400));
    }

    const participant = await Participant.findOne({ teamId });
    console.log("Participant found:", participant);
    if (!participant) {
      return res.status(404).json(formatResponse(null, "Team not found", 404));
    }

    const game = await Game.findById(gameId);
    if (!game || !game.isActive) {
      return res
        .status(404)
        .json(formatResponse(null, "Game not found or inactive", 404));
    }

    participant.gameProgress.push({
      gameId: gameId,
      points: game.gamePoints,
      assignedBy: {
        adminId: req.adminId,
        adminName: req.adminName,
        adminEmail: req.adminEmail,
      },
    });

    participant.totalPoints += game.gamePoints;
    await participant.save();

    const timesCompleted = participant.gameProgress.filter(
      (progress) => progress.gameId?.toString() === String(gameId)
    ).length;

    res.json(
      formatResponse(
        {
          teamId: participant.teamId,
          teamName: participant.teamName,
          gameCompleted: game.gameName,
          pointsAwarded: game.gamePoints,
          totalPoints: participant.totalPoints,
          timesCompletedThisGame: timesCompleted,
          assignedBy: req.adminName,
        },
        `Points assigned successfully by ${req.adminName}`
      )
    );
  } catch (error) {
    handleError(error, res);
  }
};

export const assignPointsByQR = async (req, res) => {
  try {
    const { qrData, gameId } = req.body;

    if (!qrData || !gameId) {
      return res
        .status(400)
        .json(
          formatResponse(null, "QR code data and Game ID are required", 400)
        );
    }

    let parsedData;
    try {
      parsedData = JSON.parse(qrData);
    } catch (parseError) {
      return res
        .status(400)
        .json(formatResponse(null, "Invalid QR code format", 400));
    }

    const teamId = Number(parsedData?.teamId);

    if (!Number.isSafeInteger(teamId) || teamId < 1) {
      return res
        .status(400)
        .json(formatResponse(null, "Invalid QR code data", 400));
    }

    const participant = await Participant.findOne({ teamId });
    if (!participant) {
      return res.status(404).json(formatResponse(null, "Team not found", 404));
    }

    const game = await Game.findById(gameId);
    if (!game || !game.isActive) {
      return res
        .status(404)
        .json(formatResponse(null, "Game not found or inactive", 404));
    }

    participant.gameProgress.push({
      gameId: gameId,
      points: game.gamePoints,
      assignedBy: {
        adminId: req.adminId,
        adminName: req.adminName,
        adminEmail: req.adminEmail,
      },
    });

    participant.totalPoints += game.gamePoints;
    await participant.save();

    const timesCompleted = participant.gameProgress.filter(
      (progress) => progress.gameId?.toString() === String(gameId)
    ).length;

    res.json(
      formatResponse(
        {
          teamId: participant.teamId,
          teamName: participant.teamName,
          leaderName: participant.leaderName,
          gameCompleted: game.gameName,
          pointsAwarded: game.gamePoints,
          totalPoints: participant.totalPoints,
          gamesCompleted: participant.gameProgress.length,
          timesCompletedThisGame: timesCompleted,
          assignedBy: req.adminName,
        },
        `Points assigned successfully by ${
          req.adminName
        }! (Completed ${timesCompleted} time${timesCompleted > 1 ? "s" : ""})`
      )
    );
  } catch (error) {
    handleError(error, res);
  }
};

export const verifyQRCode = async (req, res) => {
  try {
    const { qrData } = req.body;

    if (!qrData) {
      return res
        .status(400)
        .json(formatResponse(null, "QR code data is required", 400));
    }

    let parsedData;
    try {
      parsedData = JSON.parse(qrData);
    } catch (parseError) {
      return res
        .status(400)
        .json(formatResponse(null, "Invalid QR code format", 400));
    }

    const teamId = Number(parsedData?.teamId);

    if (!Number.isSafeInteger(teamId) || teamId < 1) {
      return res
        .status(400)
        .json(formatResponse(null, "Invalid QR code data", 400));
    }

    const participant = await Participant.findOne({ teamId }).populate(
      "gameProgress.gameId",
      "gameName gamePoints"
    );

    if (!participant) {
      return res.status(404).json(formatResponse(null, "Team not found", 404));
    }

    const gameStats = {};
    participant.gameProgress.forEach((progress) => {
      if (!progress.gameId) return;
      const gameId = progress.gameId._id.toString();
      if (!gameStats[gameId]) {
        gameStats[gameId] = {
          gameId: gameId,
          gameName: progress.gameId.gameName,
          gamePoints: progress.gameId.gamePoints,
          timesCompleted: 0,
          totalPointsEarned: 0,
          lastCompleted: null,
        };
      }
      gameStats[gameId].timesCompleted++;
      gameStats[gameId].totalPointsEarned += progress.points;
      gameStats[gameId].lastCompleted = progress.completedAt;
    });

    res.json(
      formatResponse(
        {
          teamId: participant.teamId,
          teamName: participant.teamName,
          leaderName: participant.leaderName,
          totalPoints: participant.totalPoints,
          totalGamesPlayed: participant.gameProgress.filter(progress => progress.gameId).length,
          uniqueGamesCompleted: Object.keys(gameStats).length,
          gameStatistics: Object.values(gameStats),
          recentActivity: participant.gameProgress
            .slice(-5)
            .reverse()
            .map((progress) => ({
              gameName: progress.gameId?.gameName || 'Points adjustment',
              points: progress.points,
              completedAt: progress.completedAt,
              assignedBy: progress.assignedBy?.adminName || "Unknown",
            })),
        },
        "QR code verified successfully"
      )
    );
  } catch (error) {
    handleError(error, res);
  }
};

export const getTeamProgress = async (req, res) => {
  try {
    const { teamId } = req.params;

    const participant = await Participant.findOne({ teamId }).populate(
      "gameProgress.gameId",
      "gameName gamePoints description"
    );

    if (!participant) {
      return res.status(404).json(formatResponse(null, "Team not found", 404));
    }

    const response = summarizeTeamProgress(participant);

    res.json(formatResponse(response, "Team progress retrieved successfully"));
  } catch (error) {
    handleError(error, res);
  }
};
