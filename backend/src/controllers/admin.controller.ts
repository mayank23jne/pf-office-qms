import { Request, Response } from "express";
import { prisma } from "../index";
import bcrypt from "bcryptjs";

// Helper function to extract effective adminId for filtering
const getEffectiveAdminId = (req: Request): number | undefined => {
  const user = (req as any).user;
  if (!user) return undefined;
  if (user.role === 'ADMIN') return user.id;
  if (user.adminId) return user.adminId;
  return undefined;
};

// --- Counter Master CRUD ---

export const getCounters = async (req: Request, res: Response) => {
  try {
    const adminId = getEffectiveAdminId(req);

    const counters = await prisma.counter.findMany({
      where: {
        isDeleted: false,
        ...(adminId ? { adminId } : {})
      },
      include: {
        User: true,
        assignedIssues: {
          include: {
            issue: true
          }
        },
        issues: {
          where: { isDeleted: false }
        }
      },
      orderBy: { id: "asc" }
    });

    res.json({ counters });
  } catch (error) {
    console.error("Get counters error:", error);
    res.status(500).json({ error: "Failed to fetch counters" });
  }
};

export const createCounter = async (req: Request, res: Response) => {
  try {
    const { name, tokenPrefix, status } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ error: "Counter name is required" });
    }
    if (!tokenPrefix || !tokenPrefix.trim()) {
      return res.status(400).json({ error: "Token prefix is required" });
    }

    const adminId = getEffectiveAdminId(req);

    const counter = await prisma.counter.create({
      data: {
        name: name.trim(),
        tokenPrefix: tokenPrefix.trim().toUpperCase(),
        status: status || "ACTIVE",
        ...(adminId ? { adminId } : {})
      }
    });

    res.json({ message: "Counter created successfully", counter });
  } catch (error) {
    console.error("Create counter error:", error);
    res.status(500).json({ error: "Failed to create counter" });
  }
};

export const updateCounter = async (req: Request, res: Response) => {
  try {
    const counterId = parseInt(req.params.id as string);
    const { name, tokenPrefix, status } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ error: "Counter name is required" });
    }
    if (!tokenPrefix || !tokenPrefix.trim()) {
      return res.status(400).json({ error: "Token prefix is required" });
    }

    const counter = await prisma.counter.update({
      where: { id: counterId },
      data: {
        name: name.trim(),
        tokenPrefix: tokenPrefix.trim().toUpperCase(),
        status: status || "ACTIVE"
      }
    });

    res.json({ message: "Counter updated successfully", counter });
  } catch (error) {
    console.error("Update counter error:", error);
    res.status(500).json({ error: "Failed to update counter" });
  }
};

export const deleteCounter = async (req: Request, res: Response) => {
  try {
    const counterId = parseInt(req.params.id as string);

    // Soft Delete
    await prisma.counter.update({
      where: { id: counterId },
      data: { isDeleted: true }
    });

    res.json({ message: "Counter deleted successfully" });
  } catch (error) {
    console.error("Delete counter error:", error);
    res.status(500).json({ error: "Failed to delete counter" });
  }
};

// --- PF Issues Master CRUD & Multi-Issue Counter Assignment ---

export const getIssues = async (req: Request, res: Response) => {
  try {
    const adminId = getEffectiveAdminId(req);

    const issues = await prisma.issue.findMany({
      where: {
        isDeleted: false,
        ...(adminId ? { adminId } : {})
      },
      include: {
        counter: true,
        counterAssignments: {
          include: {
            counter: true
          }
        }
      },
      orderBy: { id: "asc" }
    });

    res.json({ issues });
  } catch (error) {
    console.error("Get issues error:", error);
    res.status(500).json({ error: "Failed to fetch issues" });
  }
};

export const createIssue = async (req: Request, res: Response) => {
  try {
    const { name, counterId, status } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ error: "PF Issue name is required" });
    }

    const adminId = getEffectiveAdminId(req);

    const issue = await prisma.issue.create({
      data: {
        name: name.trim(),
        status: status || "PENDING",
        ...(counterId ? { counterId: parseInt(counterId) } : {}),
        ...(adminId ? { adminId } : {})
      }
    });

    if (counterId) {
      const cId = parseInt(counterId);
      await prisma.counterIssue.upsert({
        where: { counterId_issueId: { counterId: cId, issueId: issue.id } },
        create: { counterId: cId, issueId: issue.id },
        update: {}
      });
    }

    res.json({ message: "PF Issue created successfully", issue });
  } catch (error) {
    console.error("Create issue error:", error);
    res.status(500).json({ error: "Failed to create PF issue" });
  }
};

export const updateIssue = async (req: Request, res: Response) => {
  try {
    const issueId = parseInt(req.params.id as string);
    const { name, counterId, status } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ error: "PF Issue name is required" });
    }

    const issue = await prisma.issue.update({
      where: { id: issueId },
      data: {
        name: name.trim(),
        status: status || "PENDING",
        ...(counterId ? { counterId: parseInt(counterId) } : {})
      }
    });

    res.json({ message: "PF Issue updated successfully", issue });
  } catch (error) {
    console.error("Update issue error:", error);
    res.status(500).json({ error: "Failed to update PF issue" });
  }
};

export const deleteIssue = async (req: Request, res: Response) => {
  try {
    const issueId = parseInt(req.params.id as string);

    // Soft delete
    await prisma.issue.update({
      where: { id: issueId },
      data: { isDeleted: true }
    });

    res.json({ message: "PF Issue deleted successfully" });
  } catch (error) {
    console.error("Delete issue error:", error);
    res.status(500).json({ error: "Failed to delete PF issue" });
  }
};

export const assignIssuesToCounter = async (req: Request, res: Response) => {
  try {
    const counterId = parseInt(req.params.id as string);
    const { issueIds } = req.body;

    if (!Array.isArray(issueIds)) {
      return res.status(400).json({ error: "issueIds must be an array" });
    }

    await prisma.counterIssue.deleteMany({
      where: { counterId }
    });

    const assignments = [];
    for (const issueId of issueIds) {
      const parsedIssueId = parseInt(issueId);
      assignments.push({
        counterId,
        issueId: parsedIssueId
      });
    }

    if (assignments.length > 0) {
      await prisma.counterIssue.createMany({
        data: assignments,
        skipDuplicates: true
      });
    }

    res.json({ message: "Assigned PF Issues updated successfully" });
  } catch (error) {
    console.error("Assign issues error:", error);
    res.status(500).json({ error: "Failed to assign issues to counter" });
  }
};

export const getAssignedIssuesForCounter = async (req: Request, res: Response) => {
  try {
    const counterId = parseInt(req.params.id as string);

    const assignments = await prisma.counterIssue.findMany({
      where: { counterId },
      include: { issue: true }
    });

    const issues = assignments.map((a: any) => a.issue).filter((i: any) => !i.isDeleted);
    res.json({ issues });
  } catch (error) {
    console.error("Get assigned issues error:", error);
    res.status(500).json({ error: "Failed to fetch assigned issues" });
  }
};

// --- Users (Employees & Operator Mapping) ---

export const getUsers = async (req: Request, res: Response) => {
  try {
    const adminId = getEffectiveAdminId(req);

    const users = await prisma.user.findMany({
      where: {
        role: { not: "SUPER_ADMIN" },
        ...(adminId ? { adminId } : {})
      },
      include: { Counter: true },
      orderBy: { id: "asc" }
    });

    res.json({ users });
  } catch (error) {
    console.error("Get users error:", error);
    res.status(500).json({ error: "Failed to fetch employees" });
  }
};

export const createUser = async (req: Request, res: Response) => {
  try {
    const { username, password, name, role, counterId } = req.body;

    if (!username || !password || !name || !role) {
      return res.status(400).json({ error: "Username, password, name and role are required" });
    }

    const existing = await prisma.user.findUnique({ where: { username: username.trim() } });
    if (existing) {
      return res.status(400).json({ error: "Username is already taken" });
    }

    const targetCounterId = counterId ? parseInt(counterId) : null;
    if (targetCounterId) {
      const existingCounterUser = await prisma.user.findFirst({
        where: { counterId: targetCounterId }
      });
      if (existingCounterUser) {
        return res.status(400).json({
          error: `Counter is already assigned to employee "${existingCounterUser.name}" (${existingCounterUser.username}). Please select a different counter.`
        });
      }
    }

    const adminId = getEffectiveAdminId(req);
    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        username: username.trim(),
        password: hashedPassword,
        name: name.trim(),
        role,
        counterId: targetCounterId,
        ...(adminId ? { adminId } : {})
      },
      include: { Counter: true }
    });

    res.json({ message: "Employee account created successfully", user });
  } catch (error: any) {
    console.error("Create user error:", error);
    if (error.code === 'P2002') {
      const target = error.meta?.target;
      const targetStr = JSON.stringify(target || '');
      if (targetStr.includes('counterId')) {
        return res.status(400).json({ error: "Selected counter is already assigned to another employee" });
      }
      if (targetStr.includes('username')) {
        return res.status(400).json({ error: "Username is already taken" });
      }
    }
    res.status(500).json({ error: "Failed to create employee" });
  }
};

export const updateUser = async (req: Request, res: Response) => {
  try {
    const userId = parseInt(req.params.id as string);
    const { name, role, counterId, password } = req.body;

    const updateData: any = {};
    if (name) updateData.name = name.trim();
    if (role) updateData.role = role;
    if (counterId !== undefined) {
      const targetCounterId = counterId ? parseInt(counterId) : null;
      if (targetCounterId) {
        const existingCounterUser = await prisma.user.findFirst({
          where: {
            counterId: targetCounterId,
            id: { not: userId }
          }
        });
        if (existingCounterUser) {
          return res.status(400).json({
            error: `Counter is already assigned to employee "${existingCounterUser.name}" (${existingCounterUser.username}). Please select a different counter.`
          });
        }
      }
      updateData.counterId = targetCounterId;
    }

    if (password && password.trim()) {
      updateData.password = await bcrypt.hash(password, 10);
    }

    const user = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      include: { Counter: true }
    });

    res.json({ message: "Employee account updated successfully", user });
  } catch (error: any) {
    console.error("Update user error:", error);
    if (error.code === 'P2002') {
      const target = error.meta?.target;
      const targetStr = JSON.stringify(target || '');
      if (targetStr.includes('counterId')) {
        return res.status(400).json({ error: "Selected counter is already assigned to another employee" });
      }
      if (targetStr.includes('username')) {
        return res.status(400).json({ error: "Username is already taken" });
      }
    }
    res.status(500).json({ error: "Failed to update employee" });
  }
};

export const deleteUser = async (req: Request, res: Response) => {
  try {
    const userId = parseInt(req.params.id as string);

    await prisma.user.delete({ where: { id: userId } });
    res.json({ message: "Employee account deleted" });
  } catch (error) {
    console.error("Delete user error:", error);
    res.status(500).json({ error: "Failed to delete employee" });
  }
};

// --- Stats & Display Data ---

export const getStats = async (req: Request, res: Response) => {
  try {
    const todayStr = new Date().toISOString().split("T")[0];
    const adminId = getEffectiveAdminId(req);

    // Counter condition based on adminId
    const counterWhere = {
      isDeleted: false,
      status: "ACTIVE",
      ...(adminId ? { adminId } : {})
    };

    const counters = await prisma.counter.findMany({
      where: counterWhere,
      orderBy: { id: "asc" }
    });

    const counterIds = counters.map(c => c.id);
    const tokenWhere = {
      counterId: { in: counterIds.length > 0 ? counterIds : [-1] }
    };

    const [totalTokens, waitingTokens, servingTokens, completedTokens, skippedTokens, activeCounters] = await Promise.all([
      prisma.token.count({ where: tokenWhere }),
      prisma.token.count({ where: { ...tokenWhere, status: "WAITING" } }),
      prisma.token.count({ where: { ...tokenWhere, status: "SERVING" } }),
      prisma.token.count({ where: { ...tokenWhere, status: "COMPLETED" } }),
      prisma.token.count({ where: { ...tokenWhere, status: "SKIPPED" } }),
      prisma.counter.count({ where: counterWhere })
    ]);

    // Build Detailed Breakdown for each Counter for System Dashboard
    const counterBreakdown = await Promise.all(
      counters.map(async (counter) => {
        const [cntWaiting, cntServing, cntCompleted, cntSkipped, cntTotal] = await Promise.all([
          prisma.token.count({ where: { counterId: counter.id, status: "WAITING" } }),
          prisma.token.count({ where: { counterId: counter.id, status: "SERVING" } }),
          prisma.token.count({ where: { counterId: counter.id, status: "COMPLETED" } }),
          prisma.token.count({ where: { counterId: counter.id, status: "SKIPPED" } }),
          prisma.token.count({ where: { counterId: counter.id } })
        ]);

        return {
          counter,
          total: cntTotal,
          waiting: cntWaiting,
          serving: cntServing,
          completed: cntCompleted,
          skipped: cntSkipped
        };
      })
    );

    res.json({
      todayStr,
      totalTokens,
      waitingTokens,
      servingTokens,
      completedTokens,
      skippedTokens,
      activeCounters,
      counterBreakdown
    });
  } catch (error) {
    console.error("Get stats error:", error);
    res.status(500).json({ error: "Failed to fetch stats" });
  }
};

export const getPublicBranches = async (req: Request, res: Response) => {
  try {
    const branches = await prisma.user.findMany({
      where: {
        role: "ADMIN",
        isDeleted: false
      },
      select: {
        id: true,
        name: true,
        city: true,
        username: true
      },
      orderBy: { id: "asc" }
    });

    res.json({ branches });
  } catch (error) {
    console.error("Get public branches error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const getDisplayData = async (req: Request, res: Response) => {
  try {
    const todayStr = new Date().toISOString().split("T")[0];
    const reqAdminId = req.query.adminId ? parseInt(req.query.adminId as string) : undefined;
    const adminId = reqAdminId || getEffectiveAdminId(req);

    const allCounters = await prisma.counter.findMany({
      where: {
        status: "ACTIVE",
        isDeleted: false,
        ...(adminId ? { adminId } : {})
      },
      orderBy: { id: "asc" }
    });

    // Deduplicate counters by name if no specific adminId is filtered
    const seenNames = new Set<string>();
    const counters = adminId
      ? allCounters
      : allCounters.filter((c) => {
          if (seenNames.has(c.name)) {
            return false;
          }
          seenNames.add(c.name);
          return true;
        });

    const displayData = await Promise.all(
      counters.map(async (counter) => {
        const currentServing = await prisma.token.findFirst({
          where: {
            counterId: counter.id,
            date: todayStr,
            status: "SERVING"
          },
          orderBy: { updatedAt: "desc" }
        });

        const waitingCount = await prisma.token.count({
          where: {
            counterId: counter.id,
            date: todayStr,
            status: "WAITING"
          }
        });

        return {
          counter,
          currentServing,
          waitingCount
        };
      })
    );

    res.json({ displayData, adminId });
  } catch (error) {
    console.error("Get display data error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};
