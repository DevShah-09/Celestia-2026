// import Participant from "../models/Participant.js";
import { Game, Participant } from "../models/index.js";
import { formatResponse, handleError } from "../utils/helpers.js";


// ==================== AUCTION GAME ENDPOINTS ====================

// Place a bet on an auction cup
export const placeAuctionBet = async (req, res) => {
    try {
        const { teamId, gameId, cupNumber, pointsBet } = req.body;

        if (!teamId || !gameId || !cupNumber || !pointsBet) {
            return res.status(400).json(
                formatResponse(null, "Team ID, game ID, cup number, and points bet are required", 400)
            );
        }

        if (!Number.isSafeInteger(pointsBet) || pointsBet <= 0) {
            return res.status(400).json(
                formatResponse(null, "Points bet must be a positive whole number", 400)
            );
        }

        if (!Number.isInteger(cupNumber) || cupNumber < 1 || cupNumber > 4) {
            return res.status(400).json(
                formatResponse(null, "Cup number must be between 1 and 4", 400)
            );
        }

        // Verify game exists and is auction
        const game = await Game.findById(gameId);
        if (!game || !game.isActive) {
            return res.status(404).json(
                formatResponse(null, "Game not found or inactive", 404)
            );
        }

        if (game.gameType !== 'auction') {
            return res.status(400).json(
                formatResponse(null, "This game is not an auction game", 400)
            );
        }

        if (game.auctionConfig.auctionCompleted) {
            return res.status(400).json(
                formatResponse(null, "This auction has already been completed", 400)
            );
        }

        const participant = await Participant.findOne({ teamId });
        if (!participant) {
            return res.status(404).json(formatResponse(null, "Team not found", 404));
        }

        // Check if team already has an active bet
        if (participant.pointsBet > 0 || participant.activeGamblingGame.gameId) {
            return res.status(400).json(
                formatResponse(null, "Team already has an active bet. Complete or cancel it first.", 400)
            );
        }

        // Check if team has enough points
        if (participant.totalPoints < pointsBet) {
            return res.status(400).json(
                formatResponse(null, "Insufficient points to place this bet", 400)
            );
        }

        // Deduct points immediately when bet is placed
        participant.totalPoints -= pointsBet;
        participant.pointsBet = pointsBet;

        // Record the active gambling game
        participant.activeGamblingGame = {
            gameId: gameId,
            gameType: 'auction',
            cupNumber: cupNumber,
            betPlacedAt: new Date(),
        };

        await participant.save();

        res.json(
            formatResponse(
                {
                    teamId: participant.teamId,
                    teamName: participant.teamName,
                    gameName: game.gameName,
                    cupNumber,
                    pointsBet,
                    remainingPoints: participant.totalPoints,
                },
                "Auction bet placed successfully"
            )
        );
    } catch (error) {
        handleError(error, res);
    }
};

// Reveal auction results
export const revealAuctionResults = async (req, res) => {
    try {
        const { gameId, cupMultipliers } = req.body;
        // cupMultipliers should be an object like: { "1": 0, "2": 0.5, "3": 1.5, "4": 2 }

        if (!gameId || !cupMultipliers) {
            return res.status(400).json(
                formatResponse(null, "Game ID and cup multipliers are required", 400)
            );
        }

        if (typeof cupMultipliers !== 'object' || Array.isArray(cupMultipliers) || Object.keys(cupMultipliers).sort().join(',') !== '1,2,3,4') {
            return res.status(400).json(formatResponse(null, "Provide multipliers for cups 1, 2, 3 and 4", 400));
        }
        if (Object.values(cupMultipliers).some(value => typeof value !== 'number' || !Number.isFinite(value) || value < 0)) {
            return res.status(400).json(formatResponse(null, "Multipliers must be finite numbers greater than or equal to zero", 400));
        }

        // Verify the game exists and is active
        const game = await Game.findById(gameId);
        if (!game || !game.isActive) {
            return res.status(404).json(
                formatResponse(null, "Game not found or inactive", 404)
            );
        }

        if (game.gameType !== 'auction') {
            return res.status(400).json(
                formatResponse(null, "This game is not an auction game", 400)
            );
        }

        if (game.auctionConfig.auctionCompleted) {
            return res.status(400).json(
                formatResponse(null, "This auction has already been completed", 400)
            );
        }

        // Find all participants who bet on this game
        const allParticipants = await Participant.find({
            'activeGamblingGame.gameId': gameId,
            'activeGamblingGame.gameType': 'auction',
        });

        if (allParticipants.length === 0) {
            return res.status(404).json(
                formatResponse(null, "No bets were placed on this auction", 404)
            );
        }

        // Validate every payout before modifying any team.
        if (allParticipants.some(participant => {
            const payout = Math.floor(participant.pointsBet * cupMultipliers[participant.activeGamblingGame.cupNumber]);
            return !Number.isSafeInteger(payout) || !Number.isSafeInteger(participant.totalPoints + payout);
        })) {
            return res.status(400).json(formatResponse(null, "A payout exceeds the supported points range", 400));
        }
        const results = [];

        // Process each participant's bet
        for (const participant of allParticipants) {
            const betAmount = participant.pointsBet;
            const cupNumber = participant.activeGamblingGame.cupNumber;
            const multiplier = Number(cupMultipliers[cupNumber]);
            const pointsAwarded = Math.floor(betAmount * multiplier);
            const netChange = pointsAwarded - betAmount;

            participant.gameProgress.push({
                gameId: gameId,
                points: pointsAwarded,
                pointsBet: betAmount,
                cupNumber: cupNumber,
                multiplier: multiplier,
                didWin: netChange > 0,
                gameType: 'auction',
                assignedBy: {
                    adminId: req.adminId,
                    adminName: req.adminName,
                    adminEmail: req.adminEmail,
                },
            });

            participant.totalPoints += pointsAwarded;

            results.push({
                teamId: participant.teamId,
                teamName: participant.teamName,
                cupNumber: cupNumber,
                pointsBet: betAmount,
                multiplier: multiplier,
                pointsAwarded: pointsAwarded,
                netChange: netChange,
                totalPoints: participant.totalPoints,
            });

            // Clear the active bet
            participant.pointsBet = 0;
            participant.activeGamblingGame = {
                gameId: null,
                gameType: null,
                cupNumber: null,
                betPlacedAt: null,
            };
            await participant.save();
        }

        // Mark auction as completed and save multipliers
        game.auctionConfig.cupMultipliers = cupMultipliers;
        game.auctionConfig.auctionCompleted = true;
        game.auctionConfig.completedAt = new Date();
        await game.save();

        // Sort results by outcome
        const winners = results.filter((r) => r.netChange > 0);
        const losers = results.filter((r) => r.netChange < 0);

        res.json(
            formatResponse(
                {
                    gameName: game.gameName,
                    cupMultipliers,
                    allResults: results.sort((a, b) => b.netChange - a.netChange),
                    winners,
                    losers,
                    totalParticipants: results.length,
                    declaredBy: req.adminName,
                },
                `Auction results revealed successfully by ${req.adminName}`
            )
        );
    } catch (error) {
        handleError(error, res);
    }
};

// Get all auction bets
export const getAllAuctionBets = async (req, res) => {
    try {
        const { gameId } = req.query;

        if (!gameId) {
            return res.status(400).json(
                formatResponse(null, "Game ID is required", 400)
            );
        }

        const participants = await Participant.find({
            'activeGamblingGame.gameId': gameId,
            'activeGamblingGame.gameType': 'auction',
        }).select("teamId teamName pointsBet activeGamblingGame totalPoints");

        const bets = participants.map((p) => ({
            teamId: p.teamId,
            teamName: p.teamName,
            cupNumber: p.activeGamblingGame.cupNumber,
            pointsBet: p.pointsBet,
            currentTotalPoints: p.totalPoints,
            betTimestamp: p.activeGamblingGame.betPlacedAt,
        }));

        // Group by cup number
        const betsByCup = {};
        bets.forEach((bet) => {
            if (!betsByCup[bet.cupNumber]) {
                betsByCup[bet.cupNumber] = {
                    cupNumber: bet.cupNumber,
                    totalBets: 0,
                    totalPoints: 0,
                    teams: [],
                };
            }
            betsByCup[bet.cupNumber].totalBets++;
            betsByCup[bet.cupNumber].totalPoints += bet.pointsBet;
            betsByCup[bet.cupNumber].teams.push({
                teamId: bet.teamId,
                teamName: bet.teamName,
                pointsBet: bet.pointsBet,
            });
        });

        res.json(
            formatResponse(
                {
                    totalBets: bets.length,
                    bets,
                    betsByCup: Object.values(betsByCup),
                },
                "All auction bets retrieved successfully"
            )
        );
    } catch (error) {
        handleError(error, res);
    }
};

// ==================== UTILITY ENDPOINTS ====================

// Cancel active auction bet
export const cancelActiveBet = async (req, res) => {
    try {
        const { teamId } = req.body;

        if (!teamId) {
            return res.status(400).json(
                formatResponse(null, "Team ID is required", 400)
            );
        }

        const participant = await Participant.findOne({ teamId });
        if (!participant) {
            return res.status(404).json(formatResponse(null, "Team not found", 404));
        }

        if (!participant.activeGamblingGame.gameId || participant.pointsBet === 0) {
            return res.status(400).json(
                formatResponse(null, "No active bet found", 400)
            );
        }

        const gameType = participant.activeGamblingGame.gameType;
        const betAmount = participant.pointsBet;

        // Refund the points
        participant.totalPoints += betAmount;
        participant.pointsBet = 0;
        participant.activeGamblingGame = {
            gameId: null,
            gameType: null,
            cupNumber: null,
            betPlacedAt: null,
        };
        await participant.save();

        res.json(
            formatResponse(
                {
                    teamId: participant.teamId,
                    teamName: participant.teamName,
                    gameType: gameType,
                    refundedPoints: betAmount,
                    totalPoints: participant.totalPoints,
                },
                "Auction bet cancelled and points refunded"
            )
        );
    } catch (error) {
        handleError(error, res);
    }
};

// Get team's active bet status
export const getActiveBetStatus = async (req, res) => {
    try {
        const { teamId } = req.query;

        if (!teamId) {
            return res.status(400).json(
                formatResponse(null, "Team ID is required", 400)
            );
        }

        const participant = await Participant.findOne({ teamId })
            .populate('activeGamblingGame.gameId', 'gameName gameType')
            .select("teamId teamName totalPoints pointsBet activeGamblingGame");

        if (!participant) {
            return res.status(404).json(formatResponse(null, "Team not found", 404));
        }

        const hasActiveBet = participant.pointsBet > 0 && participant.activeGamblingGame.gameId;

        res.json(
            formatResponse(
                {
                    teamId: participant.teamId,
                    teamName: participant.teamName,
                    totalPoints: participant.totalPoints,
                    hasActiveBet: hasActiveBet,
                    activeBet: hasActiveBet ? {
                        gameId: participant.activeGamblingGame.gameId._id,
                        gameName: participant.activeGamblingGame.gameId.gameName,
                        gameType: participant.activeGamblingGame.gameType,
                        pointsBet: participant.pointsBet,
                        cupNumber: participant.activeGamblingGame.cupNumber,
                        betPlacedAt: participant.activeGamblingGame.betPlacedAt,
                    } : null,
                },
                "Active bet status retrieved successfully"
            )
        );
    } catch (error) {
        handleError(error, res);
    }
};