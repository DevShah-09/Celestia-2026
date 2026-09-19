import express from "express";
import { pointsController } from "../controllers/index.js";
import { authenticateAdmin, logActivity } from "../middleware/auth.js";

const router = express.Router();

// Protected routes - only admins can assign points
router.post(
  "/assign",
  authenticateAdmin,
  logActivity("ASSIGN_POINTS"),
  pointsController.assignPoints
);

router.post(
  "/assign-by-qr",
  authenticateAdmin,
  logActivity("ASSIGN_POINTS_BY_QR"),
  pointsController.assignPointsByQR
);

router.post("/verify-qr", authenticateAdmin, pointsController.verifyQRCode);

// Public route - teams can view their progress
router.get("/progress/:teamId", pointsController.getTeamProgress);

export default router;
