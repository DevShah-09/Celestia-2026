import express from "express";
import { participantController } from "../controllers/index.js";
import { authenticateAdmin, logActivity } from "../middleware/auth.js";

const router = express.Router();

// Registration route
router.post(
  "/register",
  authenticateAdmin,
  participantController.registerParticipant
);

// Participant login route
router.post("/login", participantController.loginParticipant);

// Get participant by team ID
router.get("/:teamId", participantController.getParticipantByTeamId);

// Get all participants (admin)
router.get("/", participantController.getAllParticipants);

// Get leaderboard
router.get("/leaderboard/top", participantController.getLeaderboard);

export default router;
