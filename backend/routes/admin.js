import express from "express";
import { adminController } from "../controllers/index.js";
import { authenticateAdmin, logActivity } from "../middleware/auth.js";

const router = express.Router();

router.post("/login", adminController.loginAdmin);

router.get("/profile", authenticateAdmin, adminController.getAdminProfile);

router.post("/create", authenticateAdmin, adminController.createAdmin);

router.get("/all", authenticateAdmin, adminController.getAllAdmins);

router.get(
  "/activity-logs/:adminId",
  authenticateAdmin,
  adminController.getAdminActivityLogs
);

router.patch(
  "/deactivate/:adminId",
  authenticateAdmin,
  adminController.deactivateAdmin
);

// Admin route - view points assignment history
router.get(
  "/history",
  authenticateAdmin,
  adminController.getAdminPointsHistory
);

// Admin route - subtract points by QR
router.post(
  "/subtract-points-qr",
  authenticateAdmin,
  logActivity("SUBTRACT_POINTS_BY_QR"),
  adminController.subtractPointsByQR
);

// Admin route - subtract points by team ID
router.post(
  "/subtract-points",
  authenticateAdmin,
  logActivity("SUBTRACT_POINTS"),
  adminController.subtractPointsByTeamId
);

// Admin route - add points by team ID
router.post(
  "/change-points",
  authenticateAdmin,
  logActivity("SUBTRACT_POINTS"),
  adminController.changePointsByTeamId
);

// Admin route - bulk update points for multiple teams
router.post(
  "/bulk-update-points",
  authenticateAdmin,
  logActivity("BULK_UPDATE_POINTS"),
  adminController.bulkUpdatePoints
);

export default router;
