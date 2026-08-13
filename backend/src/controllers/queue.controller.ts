import { Request, Response } from "express";
import { prisma, io } from "../index";

const getTodayStr = () => new Date().toISOString().split("T")[0];

const getEffectiveCounterId = async (req: Request): Promise<number | null> => {
  const user = (req as any).user;
  if (user?.counterId) return user.counterId;

  const adminId = user?.adminId || user?.id || (await prisma.user.findFirst({
    where: { username: 'admin', role: 'ADMIN' }
  }))?.id;

  const defaultCounter = await prisma.counter.findFirst({
    where: {
      isDeleted: false,
      status: "ACTIVE",
      ...(adminId ? { adminId } : {})
    },
    orderBy: { id: "asc" }
  });
  return defaultCounter ? defaultCounter.id : null;
};

const createTokenRecord = async (visitorName: string, mobile: string | undefined, uan: string | undefined, issueId: number, otherIssue?: string) => {
  const issue = await prisma.issue.findFirst({
    where: { id: issueId, isDeleted: false },
    include: { counter: true }
  });

  if (!issue || !issue.counter || issue.counter.isDeleted) {
    throw new Error("Invalid or inactive issue selected");
  }

  const todayStr = getTodayStr();

  const lastToken = await prisma.token.findFirst({
    where: {
      counterId: issue.counter.id,
      date: todayStr
    },
    orderBy: { id: "desc" }
  });

  let nextNumber = 1;
  if (lastToken) {
    const currentNum = parseInt(lastToken.tokenNumber.replace(issue.counter.tokenPrefix, ""));
    nextNumber = isNaN(currentNum) ? 1 : currentNum + 1;
  }

  const tokenNumberStr = `${issue.counter.tokenPrefix}${nextNumber.toString().padStart(3, '0')}`;

  const newToken = await prisma.token.create({
    data: {
      tokenNumber: tokenNumberStr,
      visitorName: visitorName || "Visitor",
      mobile: mobile || null,
      uan: uan || null,
      otherIssue: otherIssue || null,
      issueId: issue.id,
      counterId: issue.counter.id,
      date: todayStr,
      status: "WAITING"
    },
    include: {
      counter: true,
      issue: true
    }
  });

  const waitingAhead = await prisma.token.count({
    where: {
      counterId: issue.counter.id,
      date: todayStr,
      status: "WAITING",
      id: { lt: newToken.id }
    }
  });

  io.emit("queue_updated", { counterId: issue.counter.id, newToken });

  return { token: newToken, waitingAhead };
};

// Desk Token Generation (Receptionist)
export const generateToken = async (req: Request, res: Response) => {
  try {
    const { visitorName, mobile, uan, issueId, otherIssue } = req.body;
    if (!issueId) return res.status(400).json({ error: "Issue selection is required" });
    if (!mobile || !uan) return res.status(400).json({ error: "Mobile number and UAN number are required" });

    const result = await createTokenRecord(visitorName, mobile, uan, parseInt(issueId), otherIssue);
    res.json({ message: "Token generated", ...result });
  } catch (error: any) {
    console.error("Token generation error:", error);
    res.status(500).json({ error: error.message || "Internal server error" });
  }
};

// Public QR Code Visitor Self-Registration
export const generateTokenPublic = async (req: Request, res: Response) => {
  try {
    const { visitorName, mobile, uan, issueId, otherIssue } = req.body;
    if (!visitorName || !issueId) {
      return res.status(400).json({ error: "Visitor name and issue selection are required" });
    }
    if (!mobile || !uan) {
      return res.status(400).json({ error: "Mobile number and UAN number are required" });
    }

    const result = await createTokenRecord(visitorName, mobile, uan, parseInt(issueId), otherIssue);
    res.json({ message: "Self registration successful", ...result });
  } catch (error: any) {
    console.error("Public QR token generation error:", error);
    res.status(500).json({ error: error.message || "Internal server error" });
  }
};

// Track token status
export const getTokenStatus = async (req: Request, res: Response) => {
  try {
    const tokenId = parseInt(req.params.id as string);
    const todayStr = getTodayStr();

    const token = await prisma.token.findUnique({
      where: { id: tokenId },
      include: { counter: true, issue: true }
    });

    if (!token) {
      return res.status(404).json({ error: "Token not found" });
    }

    const waitingAhead = await prisma.token.count({
      where: {
        counterId: token.counterId,
        date: todayStr,
        status: "WAITING",
        id: { lt: token.id }
      }
    });

    res.json({ token, waitingAhead });
  } catch (error) {
    console.error("Get token status error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Call Next Token
export const nextToken = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    if (user.role !== "COUNTER") {
      return res.status(403).json({ error: "Only counter operators can call next token" });
    }

    const counterId = await getEffectiveCounterId(req);
    if (!counterId) return res.status(400).json({ error: "No counter assigned to user" });

    const todayStr = getTodayStr();

    await prisma.token.updateMany({
      where: { counterId, status: "SERVING", date: todayStr },
      data: { status: "COMPLETED" }
    });

    const nextWaitingToken = await prisma.token.findFirst({
      where: { counterId, status: "WAITING", date: todayStr },
      orderBy: { createdAt: "asc" }
    });

    if (!nextWaitingToken) {
      io.emit("counter_next", { counterId, token: null });
      return res.json({ message: "No waiting tokens in queue", token: null });
    }

    const servingToken = await prisma.token.update({
      where: { id: nextWaitingToken.id },
      data: { status: "SERVING" },
      include: { counter: true, issue: true }
    });

    io.emit("counter_next", { counterId, token: servingToken });

    res.json({ message: "Token called", token: servingToken });
  } catch (error) {
    console.error("Next token error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Skip Current Token
export const skipToken = async (req: Request, res: Response) => {
  try {
    const counterId = await getEffectiveCounterId(req);
    if (!counterId) return res.status(400).json({ error: "No counter found" });

    const currentToken = await prisma.token.findFirst({
      where: { counterId, status: "SERVING", date: getTodayStr() }
    });

    if (!currentToken) return res.status(400).json({ error: "No token currently serving to skip" });

    await prisma.token.update({
      where: { id: currentToken.id },
      data: { status: "SKIPPED" }
    });

    io.emit("queue_updated", { counterId });
    res.json({ message: "Token skipped successfully" });
  } catch (error) {
    console.error("Skip token error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Recall Token
export const recallToken = async (req: Request, res: Response) => {
  try {
    const counterId = await getEffectiveCounterId(req);
    const { tokenId } = req.body;

    const token = await prisma.token.findUnique({
      where: { id: parseInt(tokenId) },
      include: { counter: true, issue: true }
    });

    if (!token || (counterId && token.counterId !== counterId)) {
      return res.status(400).json({ error: "Invalid token or counter mismatch" });
    }

    if (counterId) {
      await prisma.token.updateMany({
        where: { counterId, status: "SERVING", date: getTodayStr() },
        data: { status: "COMPLETED" }
      });
    }

    const recalledToken = await prisma.token.update({
      where: { id: token.id },
      data: { status: "SERVING" },
      include: { counter: true, issue: true }
    });

    io.emit("counter_next", { counterId: token.counterId, token: recalledToken, isRecall: true });

    res.json({ message: "Token recalled", token: recalledToken });
  } catch (error) {
    console.error("Recall token error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Get Current Counter Queue (For Operator View)
export const getCurrentQueue = async (req: Request, res: Response) => {
  try {
    const counterId = await getEffectiveCounterId(req);
    if (!counterId) return res.status(400).json({ error: "No active counter found" });

    const todayStr = getTodayStr();

    const counter = await prisma.counter.findUnique({
      where: { id: counterId },
      include: {
        assignedIssues: {
          include: { issue: true }
        }
      }
    });

    const currentServing = await prisma.token.findFirst({
      where: { counterId, status: "SERVING", date: todayStr },
      include: { issue: true }
    });

    const waitingList = await prisma.token.findMany({
      where: { counterId, status: "WAITING", date: todayStr },
      include: { issue: true },
      orderBy: { createdAt: "asc" }
    });

    const skippedList = await prisma.token.findMany({
      where: { counterId, status: "SKIPPED", date: todayStr },
      include: { issue: true },
      orderBy: { updatedAt: "desc" }
    });

    const counterTokens = await prisma.token.findMany({
      where: { counterId },
      include: { issue: true },
      orderBy: { id: "desc" }
    });

    const assignedIssues = counter?.assignedIssues
      ?.map((ci: any) => ci.issue)
      ?.filter((i: any) => !i.isDeleted) || [];

    res.json({ counter, currentServing, waitingList, skippedList, assignedIssues, counterTokens });
  } catch (error) {
    console.error("Get current queue error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Counter Operator: Update status of an assigned PF Issue
export const updateIssueStatus = async (req: Request, res: Response) => {
  try {
    const issueId = parseInt(req.params.issueId as string);
    const { status } = req.body;

    if (!['PENDING', 'IN_PROGRESS', 'RESOLVED'].includes(status)) {
      return res.status(400).json({ error: "Invalid issue status. Must be PENDING, IN_PROGRESS, or RESOLVED." });
    }

    const issue = await prisma.issue.update({
      where: { id: issueId },
      data: { status }
    });

    if (issue.counterId) {
      io.emit("queue_updated", { counterId: issue.counterId });
    }

    res.json({ message: "PF Issue status updated successfully", issue });
  } catch (error) {
    console.error("Update issue status error:", error);
    res.status(500).json({ error: "Failed to update PF issue status" });
  }
};

// Public active issues (filtered by adminId if specified or user adminId)
export const getActiveIssues = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const reqAdminId = req.query.adminId ? parseInt(req.query.adminId as string) : undefined;
    let adminId = reqAdminId || (user ? (user.role === 'ADMIN' ? user.id : user.adminId) : undefined);
    if (!adminId) {
      const mainAdmin = await prisma.user.findFirst({
        where: { username: 'admin', role: 'ADMIN' }
      }) || await prisma.user.findFirst({
        where: { role: 'ADMIN' },
        orderBy: { id: 'asc' }
      });
      adminId = mainAdmin?.id;
    }

    const rawIssues = await prisma.issue.findMany({
      where: {
        isDeleted: false,
        ...(adminId ? { adminId } : {})
      },
      include: { counter: true },
      orderBy: { id: "asc" }
    });

    // Deduplicate issues by name so dropdowns never repeat the same issue name
    const seenNames = new Set<string>();
    const issues = rawIssues.filter((iss) => {
      if (seenNames.has(iss.name)) {
        return false;
      }
      seenNames.add(iss.name);
      return true;
    });

    res.json({ issues });
  } catch (error) {
    console.error("Get active issues error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Receptionist Desk Log: Get Overall Tokens in Descending Order
export const getTodayTokens = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const reqAdminId = req.query.adminId ? parseInt(req.query.adminId as string) : undefined;
    let adminId = reqAdminId || (user ? (user.role === 'ADMIN' ? user.id : user.adminId) : undefined);
    if (!adminId) {
      const mainAdmin = await prisma.user.findFirst({
        where: { username: 'admin', role: 'ADMIN' }
      }) || await prisma.user.findFirst({
        where: { role: 'ADMIN' },
        orderBy: { id: 'asc' }
      });
      adminId = mainAdmin?.id;
    }

    let counterFilter: any = {};
    if (adminId) {
      const counters = await prisma.counter.findMany({
        where: {
          isDeleted: false,
          adminId
        },
        select: { id: true }
      });
      const counterIds = counters.map(c => c.id);
      counterFilter = { counterId: { in: counterIds.length > 0 ? counterIds : [-1] } };
    }

    const tokens = await prisma.token.findMany({
      where: counterFilter,
      include: { counter: true, issue: true },
      orderBy: { id: "desc" }
    });

    res.json({ tokens });
  } catch (error) {
    console.error("Get overall tokens error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Counter Operator: Update status of a specific Token (COMPLETED, IN_PROGRESS, SKIPPED)
export const updateTokenStatus = async (req: Request, res: Response) => {
  try {
    const tokenId = parseInt(req.params.tokenId as string);
    const { status } = req.body;

    if (!['WAITING', 'SERVING', 'COMPLETED', 'SKIPPED'].includes(status)) {
      return res.status(400).json({ error: "Invalid token status. Must be WAITING, SERVING, COMPLETED, or SKIPPED." });
    }

    const token = await prisma.token.update({
      where: { id: tokenId },
      data: { status },
      include: { counter: true, issue: true }
    });

    io.emit("queue_updated", { counterId: token.counterId, token });
    res.json({ message: "Token status updated successfully", token });
  } catch (error) {
    console.error("Update token status error:", error);
    res.status(500).json({ error: "Failed to update token status" });
  }
};

// Counter Operator: Trigger explicit Token Announcement socket event
export const announceToken = async (req: Request, res: Response) => {
  try {
    const counterId = await getEffectiveCounterId(req);
    const { tokenId } = req.body || {};

    let currentServing = null;
    if (tokenId) {
      currentServing = await prisma.token.findUnique({
        where: { id: parseInt(tokenId) },
        include: { counter: true, issue: true }
      });
    }

    if (!currentServing && counterId) {
      currentServing = await prisma.token.findFirst({
        where: { counterId, status: "SERVING" },
        include: { counter: true, issue: true },
        orderBy: { updatedAt: "desc" }
      });
    }

    if (!currentServing && counterId) {
      currentServing = await prisma.token.findFirst({
        where: { counterId },
        include: { counter: true, issue: true },
        orderBy: { id: "desc" }
      });
    }

    if (!currentServing) {
      return res.status(400).json({ error: "No token found to announce" });
    }

    io.emit("counter_next", { counterId: currentServing.counterId, token: currentServing, isAnnounce: true });
    res.json({ message: "Announcement triggered successfully", token: currentServing });
  } catch (error) {
    console.error("Announce token error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};
