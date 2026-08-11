import { Router } from "express";
import {
  getSystemAdmins,
  createSystemAdmin,
  updateSystemAdmin,
  deleteSystemAdmin
} from "../controllers/superadmin.controller";
import { requireAuth, requireRole } from "../middlewares/auth.middleware";

const router = Router();

router.use(requireAuth);
router.use(requireRole(["SUPER_ADMIN"]));

// System Admins Management Routes
router.get("/admins", getSystemAdmins);
router.post("/admins", createSystemAdmin);
router.put("/admins/:id", updateSystemAdmin);
router.delete("/admins/:id", deleteSystemAdmin);

export default router;
