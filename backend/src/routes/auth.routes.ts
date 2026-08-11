import { Router } from "express";
import { login, registerAdmin } from "../controllers/auth.controller";

const router = Router();

router.post("/login", login as any);
router.post("/register-admin", registerAdmin as any);

export default router;
