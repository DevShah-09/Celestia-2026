// // import Participant from "../models/Participant.js";
// import { Game, Participant } from "../models/index.js";
// import { formatResponse, handleError } from "../utils/helpers.js";


// // ==================== CAMEL RACE ENDPOINTS ====================

// // Place a bet on a camel
// export const placeCamelBet = async (req, res) => {
//     try {
//         const { teamId, gameId, camelNumber, pointsBet } = req.body;

//         if (!teamId || !gameId || !camelNumber || !pointsBet) {
//             return res.status(400).json(
//                 formatResponse(null, "Team ID, game ID, camel number, and points bet are required", 400)
//             );
//         }

//         if (pointsBet <= 0) {
//             return res.status(400).json(
//                 formatResponse(null, "Points bet must be greater than 0", 400)
//             );
//         }

//         // Verify game exists and is camel race
//         const game = await Game.findById(gameId);
//         if (!game || !game.isActive) {
//             return res.status(404).json(
//                 formatResponse(null, "Game not found or inactive", 404)
//             );
//         }

//         // if (game.gameType !== 'camel-race') {
//         //     return res.status(400).json(
//         //         formatResponse(null, "This game is not a camel race", 400)
//         //     );
//         // }

//         if (game.camelRaceConfig.raceCompleted) {
//             return res.status(400).json(
//                 formatResponse(null, "This race has already been completed", 400)
//             );
//         }

//         const participant = await Participant.findOne({ teamId });
//         if (!participant) {
//             return res.status(404).json(formatResponse(null, "Team not found", 404));
//         }

//         // Check if team already has an active bet
//         if (participant.pointsBet > 0 || participant.activeGamblingGame.gameId) {
//             return res.status(400).json(
//                 formatResponse(null, "Team already has an active bet. Complete or cancel it first.", 400)
//             );
//         }

//         // Check if team has enough points
//         if (participant.totalPoints < pointsBet) {
//             return res.status(400).json(
//                 formatResponse(null, "Insufficient points to place this bet", 400)
//             );
//         }

//         // Deduct points immediately when bet is placed
//         participant.totalPoints -= pointsBet;
//         participant.pointsBet = pointsBet;

//         // Record the active gambling game
//         participant.activeGamblingGame = {
//             gameId: gameId,
//             gameType: 'camel-race',
//             camelNumber: camelNumber,
//             betPlacedAt: new Date(),
//         };

//         await participant.save();

//         res.json(
//             formatResponse(
//                 {
//                     teamId: participant.teamId,
//                     teamName: participant.teamName,
//                     gameName: game.gameName,
//                     camelNumber,
//                     pointsBet,
//                     remainingPoints: participant.totalPoints,
//                 },
//                 "Camel bet placed successfully"
//             )
//         );
//     } catch (error) {
//         handleError(error, res);
//     }
// };

// // Declare camel race winners (top 3)
// export const declareCamelWinner = async (req, res) => {
//     try {
//         const { gameId, firstPlace, secondPlace, thirdPlace } = req.body;

//         if (!gameId || !firstPlace || !secondPlace || !thirdPlace) {
//             return res.status(400).json(
//                 formatResponse(null, "Game ID and top 3 camel positions are required", 400)
//             );
//         }

//         // Validate that all positions are different
//         if (firstPlace === secondPlace || secondPlace === thirdPlace || firstPlace === thirdPlace) {
//             return res.status(400).json(
//                 formatResponse(null, "All three positions must have different camel numbers", 400)
//             );
//         }

//         // Verify the game exists and is active
//         const game = await Game.findById(gameId);
//         if (!game || !game.isActive) {
//             return res.status(404).json(
//                 formatResponse(null, "Game not found or inactive", 404)
//             );
//         }

//         // if (game.gameType !== 'camel-race') {
//         //     return res.status(400).json(
//         //         formatResponse(null, "This game is not a camel race", 400)
//         //     );
//         // }

//         if (game.camelRaceConfig.raceCompleted) {
//             return res.status(400).json(
//                 formatResponse(null, "This race has already been completed", 400)
//             );
//         }

//         // Find all participants who bet on this game
//         const allParticipants = await Participant.find({
//             'activeGamblingGame.gameId': gameId,
//             'activeGamblingGame.gameType': 'camel-race',
//         });

//         if (allParticipants.length === 0) {
//             return res.status(404).json(
//                 formatResponse(null, "No bets were placed on this race", 404)
//             );
//         }

//         const firstPlaceWinners = [];
//         const secondPlaceWinners = [];
//         const thirdPlaceWinners = [];
//         const losers = [];

//         // Process each participant's bet
//         for (const participant of allParticipants) {
//             const betAmount = participant.pointsBet;
//             const camelNumber = participant.activeGamblingGame.camelNumber;
//             let pointsAwarded = 0;
//             let multiplier = 0;
//             let position = null;
//             let didWin = false;

//             // Determine multiplier based on position
//             if (camelNumber === firstPlace) {
//                 multiplier = 3;
//                 pointsAwarded = betAmount * 3;
//                 position = 1;
//                 didWin = true;
//             } else if (camelNumber === secondPlace) {
//                 multiplier = 2;
//                 pointsAwarded = betAmount * 2;
//                 position = 2;
//                 didWin = true;
//             } else if (camelNumber === thirdPlace) {
//                 multiplier = 1;
//                 pointsAwarded = betAmount * 1;
//                 position = 3;
//                 didWin = true;
//             } else {
//                 // Loser - no points awarded (already deducted)
//                 multiplier = 0;
//                 pointsAwarded = 0;
//                 didWin = false;
//             }

//             // Record in game progress
//             participant.gameProgress.push({
//                 gameId: gameId,
//                 points: pointsAwarded,
//                 pointsBet: betAmount,
//                 camelNumber: camelNumber,
//                 multiplier: multiplier,
//                 didWin: didWin,
//                 gameType: 'camel-race',
//                 assignedBy: {
//                     adminId: req.adminId,
//                     adminName: req.adminName,
//                     adminEmail: req.adminEmail,
//                 },
//             });

//             participant.totalPoints += pointsAwarded;

//             const resultData = {
//                 teamId: participant.teamId,
//                 teamName: participant.teamName,
//                 camelNumber: camelNumber,
//                 pointsBet: betAmount,
//                 multiplier: multiplier,
//                 pointsAwarded: pointsAwarded,
//                 netChange: pointsAwarded - betAmount,
//                 totalPoints: participant.totalPoints,
//             };

//             // Categorize by position
//             if (position === 1) {
//                 firstPlaceWinners.push(resultData);
//             } else if (position === 2) {
//                 secondPlaceWinners.push(resultData);
//             } else if (position === 3) {
//                 thirdPlaceWinners.push(resultData);
//             } else {
//                 losers.push({
//                     ...resultData,
//                     pointsLost: betAmount,
//                 });
//             }

//             // Clear the active bet
//             participant.pointsBet = 0;
//             participant.activeGamblingGame = {
//                 gameId: null,
//                 gameType: null,
//                 camelNumber: null,
//                 cupNumber: null,
//                 betPlacedAt: null,
//             };
//             await participant.save();
//         }

//         // Mark race as completed
//         game.camelRaceConfig.winningCamel = firstPlace;
//         game.camelRaceConfig.raceCompleted = true;
//         game.camelRaceConfig.completedAt = new Date();
//         await game.save();

//         res.json(
//             formatResponse(
//                 {
//                     gameName: game.gameName,
//                     results: {
//                         firstPlace: {
//                             camelNumber: firstPlace,
//                             multiplier: 3,
//                             winners: firstPlaceWinners,
//                             count: firstPlaceWinners.length,
//                         },
//                         secondPlace: {
//                             camelNumber: secondPlace,
//                             multiplier: 2,
//                             winners: secondPlaceWinners,
//                             count: secondPlaceWinners.length,
//                         },
//                         thirdPlace: {
//                             camelNumber: thirdPlace,
//                             multiplier: 1,
//                             winners: thirdPlaceWinners,
//                             count: thirdPlaceWinners.length,
//                         },
//                         losers: {
//                             count: losers.length,
//                             teams: losers,
//                         },
//                     },
//                     summary: {
//                         totalParticipants: allParticipants.length,
//                         totalWinners: firstPlaceWinners.length + secondPlaceWinners.length + thirdPlaceWinners.length,
//                         totalLosers: losers.length,
//                     },
//                     declaredBy: req.adminName,
//                 },
//                 `Camel race results declared successfully by ${req.adminName}`
//             )
//         );
//     } catch (error) {
//         handleError(error, res);
//     }
// };

// // Get all camel bets
// export const getAllCamelBets = async (req, res) => {
//     try {
//         const { gameId } = req.query;

//         if (!gameId) {
//             return res.status(400).json(
//                 formatResponse(null, "Game ID is required", 400)
//             );
//         }

//         const participants = await Participant.find({
//             'activeGamblingGame.gameId': gameId,
//             'activeGamblingGame.gameType': 'camel-race',
//         }).select("teamId teamName pointsBet activeGamblingGame totalPoints");

//         const bets = participants.map((p) => ({
//             teamId: p.teamId,
//             teamName: p.teamName,
//             camelNumber: p.activeGamblingGame.camelNumber,
//             pointsBet: p.pointsBet,
//             currentTotalPoints: p.totalPoints,
//             betTimestamp: p.activeGamblingGame.betPlacedAt,
//         }));

//         // Group by camel number
//         const betsByCamel = {};
//         bets.forEach((bet) => {
//             if (!betsByCamel[bet.camelNumber]) {
//                 betsByCamel[bet.camelNumber] = {
//                     camelNumber: bet.camelNumber,
//                     totalBets: 0,
//                     totalPoints: 0,
//                     teams: [],
//                 };
//             }
//             betsByCamel[bet.camelNumber].totalBets++;
//             betsByCamel[bet.camelNumber].totalPoints += bet.pointsBet;
//             betsByCamel[bet.camelNumber].teams.push({
//                 teamId: bet.teamId,
//                 teamName: bet.teamName,
//                 pointsBet: bet.pointsBet,
//             });
//         });

//         res.json(
//             formatResponse(
//                 {
//                     totalBets: bets.length,
//                     bets,
//                     betsByCamel: Object.values(betsByCamel),
//                 },
//                 "All camel bets retrieved successfully"
//             )
//         );
//     } catch (error) {
//         handleError(error, res);
//     }
// };

// // ==================== AUCTION GAME ENDPOINTS ====================

// // Place a bet on an auction cup
// export const placeAuctionBet = async (req, res) => {
//     try {
//         const { teamId, gameId, cupNumber, pointsBet } = req.body;

//         if (!teamId || !gameId || !cupNumber || !pointsBet) {
//             return res.status(400).json(
//                 formatResponse(null, "Team ID, game ID, cup number, and points bet are required", 400)
//             );
//         }

//         if (pointsBet <= 0) {
//             return res.status(400).json(
//                 formatResponse(null, "Points bet must be greater than 0", 400)
//             );
//         }

//         if (cupNumber < 1 || cupNumber > 4) {
//             return res.status(400).json(
//                 formatResponse(null, "Cup number must be between 1 and 4", 400)
//             );
//         }

//         // Verify game exists and is auction
//         const game = await Game.findById(gameId);
//         if (!game || !game.isActive) {
//             return res.status(404).json(
//                 formatResponse(null, "Game not found or inactive", 404)
//             );
//         }

//         if (game.gameType !== 'auction') {
//             return res.status(400).json(
//                 formatResponse(null, "This game is not an auction game", 400)
//             );
//         }

//         if (game.auctionConfig.auctionCompleted) {
//             return res.status(400).json(
//                 formatResponse(null, "This auction has already been completed", 400)
//             );
//         }

//         const participant = await Participant.findOne({ teamId });
//         if (!participant) {
//             return res.status(404).json(formatResponse(null, "Team not found", 404));
//         }

//         // Check if team already has an active bet
//         if (participant.pointsBet > 0 || participant.activeGamblingGame.gameId) {
//             return res.status(400).json(
//                 formatResponse(null, "Team already has an active bet. Complete or cancel it first.", 400)
//             );
//         }

//         // Check if team has enough points
//         if (participant.totalPoints < pointsBet) {
//             return res.status(400).json(
//                 formatResponse(null, "Insufficient points to place this bet", 400)
//             );
//         }

//         // Deduct points immediately when bet is placed
//         participant.totalPoints -= pointsBet;
//         participant.pointsBet = pointsBet;

//         // Record the active gambling game
//         participant.activeGamblingGame = {
//             gameId: gameId,
//             gameType: 'auction',
//             cupNumber: cupNumber,
//             betPlacedAt: new Date(),
//         };

//         await participant.save();

//         res.json(
//             formatResponse(
//                 {
//                     teamId: participant.teamId,
//                     teamName: participant.teamName,
//                     gameName: game.gameName,
//                     cupNumber,
//                     pointsBet,
//                     remainingPoints: participant.totalPoints,
//                 },
//                 "Auction bet placed successfully"
//             )
//         );
//     } catch (error) {
//         handleError(error, res);
//     }
// };

// // Reveal auction results
// export const revealAuctionResults = async (req, res) => {
//     try {
//         const { gameId, cupMultipliers } = req.body;
//         // cupMultipliers should be an object like: { "1": 0, "2": 0.5, "3": 1.5, "4": 2 }

//         if (!gameId || !cupMultipliers) {
//             return res.status(400).json(
//                 formatResponse(null, "Game ID and cup multipliers are required", 400)
//             );
//         }

//         // Validate multipliers
//         const validMultipliers = [0, 0.5, 1.5, 2];
//         const providedMultipliers = Object.values(cupMultipliers).map(Number);

//         if (providedMultipliers.length !== 4) {
//             return res.status(400).json(
//                 formatResponse(null, "Must provide multipliers for all 4 cups", 400)
//             );
//         }

//         for (const mult of providedMultipliers) {
//             if (!validMultipliers.includes(mult)) {
//                 return res.status(400).json(
//                     formatResponse(null, "Multipliers must be 0, 0.5, 1.5, or 2", 400)
//                 );
//             }
//         }

//         // Check if all multipliers are used exactly once
//         const sortedProvided = [...providedMultipliers].sort();
//         const sortedValid = [...validMultipliers].sort();
//         if (JSON.stringify(sortedProvided) !== JSON.stringify(sortedValid)) {
//             return res.status(400).json(
//                 formatResponse(null, "Each multiplier (0, 0.5, 1.5, 2) must be used exactly once", 400)
//             );
//         }

//         // Verify the game exists and is active
//         const game = await Game.findById(gameId);
//         if (!game || !game.isActive) {
//             return res.status(404).json(
//                 formatResponse(null, "Game not found or inactive", 404)
//             );
//         }

//         if (game.gameType !== 'auction') {
//             return res.status(400).json(
//                 formatResponse(null, "This game is not an auction game", 400)
//             );
//         }

//         if (game.auctionConfig.auctionCompleted) {
//             return res.status(400).json(
//                 formatResponse(null, "This auction has already been completed", 400)
//             );
//         }

//         // Find all participants who bet on this game
//         const allParticipants = await Participant.find({
//             'activeGamblingGame.gameId': gameId,
//             'activeGamblingGame.gameType': 'auction',
//         });

//         if (allParticipants.length === 0) {
//             return res.status(404).json(
//                 formatResponse(null, "No bets were placed on this auction", 404)
//             );
//         }

//         const results = [];

//         // Process each participant's bet
//         for (const participant of allParticipants) {
//             const betAmount = participant.pointsBet;
//             const cupNumber = participant.activeGamblingGame.cupNumber;
//             const multiplier = Number(cupMultipliers[cupNumber]);
//             const pointsAwarded = Math.floor(betAmount * multiplier);
//             const netChange = pointsAwarded - betAmount;

//             participant.gameProgress.push({
//                 gameId: gameId,
//                 points: pointsAwarded,
//                 pointsBet: betAmount,
//                 cupNumber: cupNumber,
//                 multiplier: multiplier,
//                 didWin: multiplier >= 1.5,
//                 gameType: 'auction',
//                 assignedBy: {
//                     adminId: req.adminId,
//                     adminName: req.adminName,
//                     adminEmail: req.adminEmail,
//                 },
//             });

//             participant.totalPoints += pointsAwarded;

//             results.push({
//                 teamId: participant.teamId,
//                 teamName: participant.teamName,
//                 cupNumber: cupNumber,
//                 pointsBet: betAmount,
//                 multiplier: multiplier,
//                 pointsAwarded: pointsAwarded,
//                 netChange: netChange,
//                 totalPoints: participant.totalPoints,
//             });

//             // Clear the active bet
//             participant.pointsBet = 0;
//             participant.activeGamblingGame = {
//                 gameId: null,
//                 gameType: null,
//                 camelNumber: null,
//                 cupNumber: null,
//                 betPlacedAt: null,
//             };
//             await participant.save();
//         }

//         // Mark auction as completed and save multipliers
//         game.auctionConfig.cupMultipliers = cupMultipliers;
//         game.auctionConfig.auctionCompleted = true;
//         game.auctionConfig.completedAt = new Date();
//         await game.save();

//         // Sort results by outcome
//         const winners = results.filter((r) => r.multiplier >= 1.5);
//         const losers = results.filter((r) => r.multiplier < 1.5);

//         res.json(
//             formatResponse(
//                 {
//                     gameName: game.gameName,
//                     cupMultipliers,
//                     allResults: results.sort((a, b) => b.netChange - a.netChange),
//                     winners,
//                     losers,
//                     totalParticipants: results.length,
//                     declaredBy: req.adminName,
//                 },
//                 `Auction results revealed successfully by ${req.adminName}`
//             )
//         );
//     } catch (error) {
//         handleError(error, res);
//     }
// };

// // Get all auction bets
// export const getAllAuctionBets = async (req, res) => {
//     try {
//         const { gameId } = req.query;

//         if (!gameId) {
//             return res.status(400).json(
//                 formatResponse(null, "Game ID is required", 400)
//             );
//         }

//         const participants = await Participant.find({
//             'activeGamblingGame.gameId': gameId,
//             'activeGamblingGame.gameType': 'auction',
//         }).select("teamId teamName pointsBet activeGamblingGame totalPoints");

//         const bets = participants.map((p) => ({
//             teamId: p.teamId,
//             teamName: p.teamName,
//             cupNumber: p.activeGamblingGame.cupNumber,
//             pointsBet: p.pointsBet,
//             currentTotalPoints: p.totalPoints,
//             betTimestamp: p.activeGamblingGame.betPlacedAt,
//         }));

//         // Group by cup number
//         const betsByCup = {};
//         bets.forEach((bet) => {
//             if (!betsByCup[bet.cupNumber]) {
//                 betsByCup[bet.cupNumber] = {
//                     cupNumber: bet.cupNumber,
//                     totalBets: 0,
//                     totalPoints: 0,
//                     teams: [],
//                 };
//             }
//             betsByCup[bet.cupNumber].totalBets++;
//             betsByCup[bet.cupNumber].totalPoints += bet.pointsBet;
//             betsByCup[bet.cupNumber].teams.push({
//                 teamId: bet.teamId,
//                 teamName: bet.teamName,
//                 pointsBet: bet.pointsBet,
//             });
//         });

//         res.json(
//             formatResponse(
//                 {
//                     totalBets: bets.length,
//                     bets,
//                     betsByCup: Object.values(betsByCup),
//                 },
//                 "All auction bets retrieved successfully"
//             )
//         );
//     } catch (error) {
//         handleError(error, res);
//     }
// };

// // ==================== UTILITY ENDPOINTS ====================

// // Cancel active bet (works for both camel and auction)
// export const cancelActiveBet = async (req, res) => {
//     try {
//         const { teamId } = req.body;

//         if (!teamId) {
//             return res.status(400).json(
//                 formatResponse(null, "Team ID is required", 400)
//             );
//         }

//         const participant = await Participant.findOne({ teamId });
//         if (!participant) {
//             return res.status(404).json(formatResponse(null, "Team not found", 404));
//         }

//         if (!participant.activeGamblingGame.gameId || participant.pointsBet === 0) {
//             return res.status(400).json(
//                 formatResponse(null, "No active bet found", 400)
//             );
//         }

//         const gameType = participant.activeGamblingGame.gameType;
//         const betAmount = participant.pointsBet;

//         // Refund the points
//         participant.totalPoints += betAmount;
//         participant.pointsBet = 0;
//         participant.activeGamblingGame = {
//             gameId: null,
//             gameType: null,
//             camelNumber: null,
//             cupNumber: null,
//             betPlacedAt: null,
//         };
//         await participant.save();

//         res.json(
//             formatResponse(
//                 {
//                     teamId: participant.teamId,
//                     teamName: participant.teamName,
//                     gameType: gameType,
//                     refundedPoints: betAmount,
//                     totalPoints: participant.totalPoints,
//                 },
//                 `${gameType === 'camel-race' ? 'Camel' : 'Auction'} bet cancelled and points refunded`
//             )
//         );
//     } catch (error) {
//         handleError(error, res);
//     }
// };

// // Get team's active bet status
// export const getActiveBetStatus = async (req, res) => {
//     try {
//         const { teamId } = req.query;

//         if (!teamId) {
//             return res.status(400).json(
//                 formatResponse(null, "Team ID is required", 400)
//             );
//         }

//         const participant = await Participant.findOne({ teamId })
//             .populate('activeGamblingGame.gameId', 'gameName gameType')
//             .select("teamId teamName totalPoints pointsBet activeGamblingGame");

//         if (!participant) {
//             return res.status(404).json(formatResponse(null, "Team not found", 404));
//         }

//         const hasActiveBet = participant.pointsBet > 0 && participant.activeGamblingGame.gameId;

//         res.json(
//             formatResponse(
//                 {
//                     teamId: participant.teamId,
//                     teamName: participant.teamName,
//                     totalPoints: participant.totalPoints,
//                     hasActiveBet: hasActiveBet,
//                     activeBet: hasActiveBet ? {
//                         gameId: participant.activeGamblingGame.gameId._id,
//                         gameName: participant.activeGamblingGame.gameId.gameName,
//                         gameType: participant.activeGamblingGame.gameType,
//                         pointsBet: participant.pointsBet,
//                         camelNumber: participant.activeGamblingGame.camelNumber,
//                         cupNumber: participant.activeGamblingGame.cupNumber,
//                         betPlacedAt: participant.activeGamblingGame.betPlacedAt,
//                     } : null,
//                 },
//                 "Active bet status retrieved successfully"
//             )
//         );
//     } catch (error) {
//         handleError(error, res);
//     }
// };