import { Response } from "express";
import { PrismaClient } from "@prisma/client";
import { AuthRequest } from "../middleware/authMiddleware";

const prisma = new PrismaClient();

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

// GET /api/watch-history?profileId=xxx
// Returns everything watched, most recent first — this powers "Continue Watching"
export async function getWatchHistory(req: AuthRequest, res: Response) {
  try {
    const profileId = req.query.profileId as string;

    if (!profileId) {
      return res.status(400).json({ error: "profileId is required" });
    }

    const ownership = await verifyProfileOwnership(profileId, req.user!.userId);
    if (!ownership.valid) {
      return res.status(ownership.status!).json({ error: ownership.error });
    }

    const items = await prisma.watchHistory.findMany({
      where: { profileId },
      orderBy: { watchedAt: "desc" },
    });

    return res.status(200).json({ history: items });
  } catch (error) {
    console.error("Get watch history error:", error);
    return res.status(500).json({ error: "Failed to load watch history" });
  }
}

// POST /api/watch-history
// body: { movieId: number, profileId: string, progress: number }
// Unlike watchlist/favorites, this doesn't check "already exists" — it always
// writes, either creating a new entry or updating an existing one's progress.
export async function updateWatchProgress(req: AuthRequest, res: Response) {
  try {
    const { movieId, profileId, progress } = req.body;

    if (!movieId || !profileId || progress === undefined) {
      return res.status(400).json({ error: "movieId, profileId, and progress are required" });
    }

    if (progress < 0 || progress > 100) {
      return res.status(400).json({ error: "progress must be between 0 and 100" });
    }

    const ownership = await verifyProfileOwnership(profileId, req.user!.userId);
    if (!ownership.valid) {
      return res.status(ownership.status!).json({ error: ownership.error });
    }

    const item = await prisma.watchHistory.upsert({
      where: { profileId_movieId: { profileId, movieId } },
      update: {
        progress,
        watchedAt: new Date(), // bump timestamp so it moves to the front of "Continue Watching"
      },
      create: {
        movieId,
        profileId,
        progress,
      },
    });

    return res.status(200).json({ item });
  } catch (error) {
    console.error("Update watch progress error:", error);
    return res.status(500).json({ error: "Failed to update watch progress" });
  }
}

// DELETE /api/watch-history/:movieId?profileId=xxx
// Lets a user remove something from "Continue Watching" manually
export async function removeFromHistory(req: AuthRequest, res: Response) {
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

    await prisma.watchHistory.deleteMany({
      where: { profileId, movieId },
    });

    return res.status(200).json({ message: "Removed from watch history" });
  } catch (error) {
    console.error("Remove from history error:", error);
    return res.status(500).json({ error: "Failed to remove from watch history" });
  }
}