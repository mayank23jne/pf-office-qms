import { Router } from "express";
import {
  getUsers,
  createUser,
  updateUser,
  deleteUser,
  getCounters,
  createCounter,
  updateCounter,
  deleteCounter,
  getIssues,
  createIssue,
  updateIssue,
  deleteIssue,
  assignIssuesToCounter,
  getAssignedIssuesForCounter,
  getStats,
  getDisplayData,
  getPublicBranches
} from "../controllers/admin.controller";
import { requireAuth, requireRole } from "../middlewares/auth.middleware";

const router = Router();

const adminRoles = ["SUPER_ADMIN", "CITY_ADMIN", "ADMIN"];

// Publicly accessible LED display & Branch list endpoints
router.get("/display", getDisplayData as any);
router.get("/branches", getPublicBranches as any);

// Protected Admin Routes
router.use(requireAuth);

// Counter Master Routes
router.get("/counters", requireRole(adminRoles), getCounters as any);
router.post("/counters", requireRole(adminRoles), createCounter as any);
router.put("/counters/:id", requireRole(adminRoles), updateCounter as any);
router.delete("/counters/:id", requireRole(adminRoles), deleteCounter as any);
router.post("/counters/:id/assign-issues", requireRole(adminRoles), assignIssuesToCounter as any);
router.get("/counters/:id/assigned-issues", requireRole(adminRoles), getAssignedIssuesForCounter as any);

// PF Issues Master Routes
router.get("/issues", requireRole(adminRoles), getIssues as any);
router.post("/issues", requireRole(adminRoles), createIssue as any);
router.put("/issues/:id", requireRole(adminRoles), updateIssue as any);
router.delete("/issues/:id", requireRole(adminRoles), deleteIssue as any);

// Employee & Operator Mapping Routes
router.get("/users", requireRole(adminRoles), getUsers as any);
router.post("/users", requireRole(adminRoles), createUser as any);
router.put("/users/:id", requireRole(adminRoles), updateUser as any);
router.delete("/users/:id", requireRole(adminRoles), deleteUser as any);

// Dashboard Stats
router.get("/stats", requireRole(adminRoles), getStats as any);

export default router;
