import { Request, Response } from "express";
import { prisma } from "../index";
import bcrypt from "bcryptjs";
import { generateToken } from "../utils/auth";
import { logger } from "../utils/logger";

export const login = async (req: Request, res: Response) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: "Username and password are required" });
    }

    const user = await prisma.user.findUnique({
      where: { username },
      include: {
        Counter: true
      }
    });

    if (!user) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const effectiveAdminId = user.role === 'ADMIN' ? user.id : user.adminId;

    const token = generateToken({
      id: user.id,
      username: user.username,
      role: user.role,
      counterId: user.counterId,
      adminId: effectiveAdminId,
      city: user.city
    });

    res.json({
      message: "Login successful",
      token,
      user: {
        id: user.id,
        username: user.username,
        name: user.name,
        role: user.role,
        counterId: user.counterId,
        adminId: effectiveAdminId,
        city: user.city,
        counter: user.Counter
      }
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const registerAdmin = async (req: Request, res: Response) => {
  try {
    const { username, password, name } = req.body;
    if (!username || !password || !name) {
      return res.status(400).json({ error: "Username, password and name are required" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: {
        username,
        password: hashedPassword,
        name,
        role: "ADMIN"
      }
    });

    res.json({ message: "Admin created", user: { id: user.id, username, role: user.role } });
  } catch (error: any) {
    if (error.code === 'P2002') {
      return res.status(400).json({ error: "Username already exists" });
    }
    res.status(500).json({ error: "Internal server error" });
  }
};
