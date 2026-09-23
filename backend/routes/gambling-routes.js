import { settleBulkBets } from '../controllers/bulkBettingController.js';
import express from "express";
import {
  placeAuctionBet,
  revealAuctionResults,
  getAllAuctionBets,
  cancelActiveBet,
  getActiveBetStatus,
} from "../controllers/gamblingController.js";
import { authenticateAdmin } from "../middleware/auth.js";

const router = express.Router();
router.post("/bulk-settle", authenticateAdmin, settleBulkBets);

// Auction Routes
router.post("/auction/bet", authenticateAdmin, placeAuctionBet);
router.post("/auction/reveal", authenticateAdmin, revealAuctionResults);
router.get("/auction/bets", authenticateAdmin, getAllAuctionBets);

// Common Routes
router.post("/cancel-bet", authenticateAdmin, cancelActiveBet);
router.get("/active-bet-status", authenticateAdmin, getActiveBetStatus);

export default router;