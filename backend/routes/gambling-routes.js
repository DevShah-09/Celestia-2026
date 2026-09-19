// import express from "express";
// import {
//   placeCamelBet,
//   declareCamelWinner,
//   getAllCamelBets,
//   placeAuctionBet,
//   revealAuctionResults,
//   getAllAuctionBets,
//   cancelActiveBet,
//   getActiveBetStatus,
// } from "../controllers/gamblingController.js";
// import { authenticateAdmin } from "../middleware/auth.js";

// const router = express.Router();

// // Camel Race Routes
// router.post("/camel/bet", authenticateAdmin, placeCamelBet);
// router.post("/camel/declare-winner", authenticateAdmin, declareCamelWinner);
// router.get("/camel/bets", authenticateAdmin, getAllCamelBets);

// // Auction Routes
// router.post("/auction/bet", authenticateAdmin, placeAuctionBet);
// router.post("/auction/reveal", authenticateAdmin, revealAuctionResults);
// router.get("/auction/bets", authenticateAdmin, getAllAuctionBets);

// // Common Routes
// router.post("/cancel-bet", cancelActiveBet);
// router.get("/active-bet-status", getActiveBetStatus);

// export default router;