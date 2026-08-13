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

// GET /api/favorites?profileId=xxx
export async function getFavorites(req: AuthRequest, res: Response) {
  try {
    const profileId = req.query.profileId as string;

    if (!profileId) {
      return res.status(400).json({ error: "profileId is required" });
    }

    const ownership = await verifyProfileOwnership(profileId, req.user!.userId);
    if (!ownership.valid) {
      return res.status(ownership.status!).json({ error: ownership.error });
    }

    const items = await prisma.favorite.findMany({
      where: { profileId },
      orderBy: { createdAt: "desc" },
    });

    return res.status(200).json({ favorites: items });
  } catch (error) {
    console.error("Get favorites error:", error);
    return res.status(500).json({ error: "Failed to load favorites" });
  }
}

// POST /api/favorites
// body: { movieId: number, profileId: string }
export async function addToFavorites(req: AuthRequest, res: Response) {
  try {
    const { movieId, profileId } = req.body;

    if (!movieId || !profileId) {
      return res.status(400).json({ error: "movieId and profileId are required" });
    }

    const ownership = await verifyProfileOwnership(profileId, req.user!.userId);
    if (!ownership.valid) {
      return res.status(ownership.status!).json({ error: ownership.error });
    }

    const existing = await prisma.favorite.findUnique({
      where: { profileId_movieId: { profileId, movieId } },
    });

    if (existing) {
      return res.status(409).json({ error: "Already in favorites" });
    }

    const item = await prisma.favorite.create({
      data: { movieId, profileId },
    });

    return res.status(201).json({ item });
  } catch (error) {
    console.error("Add to favorites error:", error);
    return res.status(500).json({ error: "Failed to add to favorites" });
  }
}

// DELETE /api/favorites/:movieId?profileId=xxx
export async function removeFromFavorites(req: AuthRequest, res: Response) {
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

    await prisma.favorite.deleteMany({
      where: { profileId, movieId },
    });

    return res.status(200).json({ message: "Removed from favorites" });
  } catch (error) {
    console.error("Remove from favorites error:", error);
    return res.status(500).json({ error: "Failed to remove from favorites" });
  }
}