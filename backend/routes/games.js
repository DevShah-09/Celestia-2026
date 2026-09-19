import express from "express";
import { gameController } from "../controllers/index.js";
import { authenticateAdmin, logActivity } from "../middleware/auth.js";

const router = express.Router();

// Public route - anyone can view games
router.get("/", gameController.getAllGames);
router.get("/:gameId", gameController.getGameById);

// Protected routes - only admins
router.post(
  "/",
  authenticateAdmin,
  logActivity("CREATE_GAME"),
  gameController.createGame
);

router.put(
  "/:gameId",
  authenticateAdmin,
  logActivity("UPDATE_GAME"),
  gameController.updateGame
);

router.delete(
  "/:gameId",
  authenticateAdmin,
  logActivity("DELETE_GAME"),
  gameController.deleteGame
);

export default router;
