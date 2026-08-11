import { Router } from "express";
import {
  generateToken,
  generateTokenPublic,
  getTokenStatus,
  nextToken,
  skipToken,
  recallToken,
  getCurrentQueue,
  updateIssueStatus,
  updateTokenStatus,
  announceToken,
  getActiveIssues,
  getTodayTokens
} from "../controllers/queue.controller";
import { requireAuth, requireRole } from "../middlewares/auth.middleware";

const router = Router();

// Public Endpoints (Accessible without auth token)
router.get("/issues", getActiveIssues as any);
router.post("/generate-public", generateTokenPublic as any);
router.get("/token-status/:id", getTokenStatus as any);

// Receptionist Desk Endpoint
router.post("/generate", requireAuth, requireRole(["SUPER_ADMIN", "CITY_ADMIN", "ADMIN", "RECEPTION"]), generateToken as any);
router.get("/today-tokens", requireAuth, requireRole(["SUPER_ADMIN", "CITY_ADMIN", "ADMIN", "RECEPTION"]), getTodayTokens as any);

// Counter Operator Endpoints
router.get("/current", requireAuth, requireRole(["COUNTER"]), getCurrentQueue as any);
router.post("/next", requireAuth, requireRole(["COUNTER"]), nextToken as any);
router.post("/skip", requireAuth, requireRole(["COUNTER"]), skipToken as any);
router.post("/recall", requireAuth, requireRole(["COUNTER"]), recallToken as any);
router.post("/announce", requireAuth, requireRole(["COUNTER"]), announceToken as any);
router.put("/token-status/:tokenId", requireAuth, requireRole(["SUPER_ADMIN", "CITY_ADMIN", "ADMIN", "COUNTER"]), updateTokenStatus as any);
router.put("/issue-status/:issueId", requireAuth, requireRole(["SUPER_ADMIN", "CITY_ADMIN", "ADMIN", "COUNTER"]), updateIssueStatus as any);

export default router;
