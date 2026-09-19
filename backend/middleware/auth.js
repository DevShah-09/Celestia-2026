import jwt from "jsonwebtoken";
import { Admin } from "../models/index.js";

export const authenticateAdmin = async (req, res, next) => {
  try {
    const token = req.headers["authorization"]?.replace("Bearer ", "");

    if (!token) {
      return res.status(403).json({ message: "No token provided." });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const admin = await Admin.findById(decoded.id);
    if (!admin || !admin.isActive || !['admin', 'superadmin'].includes(admin.role)) {
      return res.status(401).json({ message: "Unauthorized!" });
    }

    req.adminId = decoded.id;
    req.adminEmail = admin.email;
    req.adminName = admin.name;
    req.adminRole = admin.role;

    next();
  } catch (err) {
    return res.status(401).json({ message: "Invalid or expired token!" });
  }
};

export const logActivity = (action) => {
  return async (req, res, next) => {
    try {
      const admin = await Admin.findById(req.adminId);
      if (admin) {
        const description = `${action} by ${req.adminName} (${req.adminEmail})`;
        await admin.addActivityLog(action, description);
      }
      next();
    } catch (error) {
      console.error("Activity logging error:", error);
      next(); 
    }
  };
};

export default { authenticateAdmin, logActivity };
