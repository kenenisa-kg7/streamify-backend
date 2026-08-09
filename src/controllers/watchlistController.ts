import { Response } from "express";
import { PrismaClient } from "@prisma/client";
import { AuthRequest } from "../middleware/authMiddleware";

const prisma = new PrismaClient();

// Confirms the given profileId actually belongs to the logged-in user.
// Used by every watchlist route, since Watchlist is scoped by profile, not user directly.
async function verifyProfileOwnership(profileId: string, userId: string) {
  const profile = await prisma.profile.findUnique({ where: { id: profileId } });
  if (!profile) {
    return { valid: false, status: 404, error: "Profile not found" };
  }
  if (profile.userId !== userId) {
    return { valid: false, status: 403, error: "This profile does not belong to you" };
  }
  return { valid: true };
}

// GET /api/watchlist?profileId=xxx
export async function getWatchlist(req: AuthRequest, res: Response) {
  try {
    const profileId = req.query.profileId as string;

    if (!profileId) {
      return res.status(400).json({ error: "profileId is required" });
    }

    const ownership = await verifyProfileOwnership(profileId, req.user!.userId);
    if (!ownership.valid) {
      return res.status(ownership.status!).json({ error: ownership.error });
    }

    const items = await prisma.watchlist.findMany({
      where: { profileId },
      orderBy: { createdAt: "desc" },
    });

    return res.status(200).json({ watchlist: items });
  } catch (error) {
    console.error("Get watchlist error:", error);
    return res.status(500).json({ error: "Failed to load watchlist" });
  }
}

// POST /api/watchlist
// body: { movieId: number, profileId: string }
export async function addToWatchlist(req: AuthRequest, res: Response) {
  try {
    const { movieId, profileId } = req.body;

    if (!movieId || !profileId) {
      return res.status(400).json({ error: "movieId and profileId are required" });
    }

    const ownership = await verifyProfileOwnership(profileId, req.user!.userId);
    if (!ownership.valid) {
      return res.status(ownership.status!).json({ error: ownership.error });
    }

    // @@unique([profileId, movieId]) in the schema means this throws if it already exists —
    // we check first so we can return a clean, friendly response instead of a raw DB error.
    const existing = await prisma.watchlist.findUnique({
      where: { profileId_movieId: { profileId, movieId } },
    });

    if (existing) {
      return res.status(409).json({ error: "Already in watchlist" });
    }

    const item = await prisma.watchlist.create({
      data: { movieId, profileId },
    });

    return res.status(201).json({ item });
  } catch (error) {
    console.error("Add to watchlist error:", error);
    return res.status(500).json({ error: "Failed to add to watchlist" });
  }
}

// DELETE /api/watchlist/:movieId?profileId=xxx
export async function removeFromWatchlist(req: AuthRequest, res: Response) {
  try {
    const movieId = Number(req.params.movieId);
    const profileId = req.query.profileId as string;

    if (!profileId) {
      return res.status(400).json({ error: "profileId is required" });
    }

    const ownership = await verifyProfileOwnership(profileId, req.user!.userId);
    if (!ownership.valid) {
      return res.status(ownership.status!).json({ error: ownership.error });
    }

    await prisma.watchlist.deleteMany({
      where: { profileId, movieId },
    });

    return res.status(200).json({ message: "Removed from watchlist" });
  } catch (error) {
    console.error("Remove from watchlist error:", error);
    return res.status(500).json({ error: "Failed to remove from watchlist" });
  }
}