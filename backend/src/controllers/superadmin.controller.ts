import { Request, Response } from "express";
import { prisma } from "../index";
import bcrypt from "bcryptjs";

// --- Super Admin System Admin Management ---

export const getSystemAdmins = async (req: Request, res: Response) => {
  try {
    const admins = await prisma.user.findMany({
      where: {
        role: "ADMIN"
      },
      orderBy: { id: "asc" }
    });
    res.json({ admins });
  } catch (error) {
    console.error("Get system admins error:", error);
    res.status(500).json({ error: "Failed to fetch admins" });
  }
};

export const createSystemAdmin = async (req: Request, res: Response) => {
  try {
    const { username, password, name, city } = req.body;

    if (!username || !password || !name) {
      return res.status(400).json({ error: "Username, password, and name are required" });
    }

    const existing = await prisma.user.findUnique({ where: { username: username.trim() } });
    if (existing) {
      return res.status(400).json({ error: "Username is already taken" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const admin = await prisma.user.create({
      data: {
        username: username.trim(),
        password: hashedPassword,
        name: name.trim(),
        city: city ? city.trim() : null,
        role: "ADMIN"
      }
    });

    res.json({ message: "System Admin created successfully", admin });
  } catch (error) {
    console.error("Create system admin error:", error);
    res.status(500).json({ error: "Failed to create admin" });
  }
};

export const updateSystemAdmin = async (req: Request, res: Response) => {
  try {
    const adminId = parseInt(req.params.id as string);
    const { name, password, city } = req.body;

    const updateData: any = {};
    if (name) updateData.name = name.trim();
    if (city !== undefined) updateData.city = city ? city.trim() : null;
    if (password && password.trim()) {
      updateData.password = await bcrypt.hash(password, 10);
    }

    const admin = await prisma.user.update({
      where: { id: adminId },
      data: updateData
    });

    res.json({ message: "System Admin updated successfully", admin });
  } catch (error) {
    console.error("Update system admin error:", error);
    res.status(500).json({ error: "Failed to update admin" });
  }
};

export const deleteSystemAdmin = async (req: Request, res: Response) => {
  try {
    const adminId = parseInt(req.params.id as string);

    await prisma.user.delete({ where: { id: adminId } });
    res.json({ message: "System Admin deleted successfully" });
  } catch (error) {
    console.error("Delete system admin error:", error);
    res.status(500).json({ error: "Failed to delete admin" });
  }
};
