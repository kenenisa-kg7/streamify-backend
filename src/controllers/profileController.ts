import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { AuthRequest } from "../middleware/authMiddleware";

const prisma = new PrismaClient();

// GET /api/profiles — list all profiles belonging to the logged-in user
export async function getProfiles(req: AuthRequest, res: Response) {
  try {
    const profiles = await prisma.profile.findMany({
      where: { userId: req.user!.userId },
      orderBy: { createdAt: "asc" },
    });

    return res.status(200).json({ profiles });
  } catch (error) {
    console.error("Get profiles error:", error);
    return res.status(500).json({ error: "Failed to load profiles" });
  }
}

// POST /api/profiles — create a new profile for the logged-in user
export async function createProfile(req: AuthRequest, res: Response) {
  try {
    const { name, avatar } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ error: "Profile name is required" });
    }

    // Netflix-style limit: max 5 profiles per account
    const existingCount = await prisma.profile.count({
      where: { userId: req.user!.userId },
    });

    if (existingCount >= 5) {
      return res.status(400).json({ error: "Maximum of 5 profiles allowed" });
    }

    const profile = await prisma.profile.create({
      data: {
        name: name.trim(),
        avatar: avatar || "👤",
        userId: req.user!.userId,
      },
    });

    return res.status(201).json({ profile });
  } catch (error) {
    console.error("Create profile error:", error);
    return res.status(500).json({ error: "Failed to create profile" });
  }
}

// DELETE /api/profiles/:id — delete a profile, only if it belongs to the logged-in user
export async function deleteProfile(req: AuthRequest, res: Response) {
  try {
    const id = req.params.id as string;

    const profile = await prisma.profile.findUnique({ where: { id } });

    if (!profile) {
      return res.status(404).json({ error: "Profile not found" });
    }

    if (profile.userId !== req.user!.userId) {
      return res.status(403).json({ error: "You don't have permission to delete this profile" });
    }

    await prisma.profile.delete({ where: { id } });

    return res.status(200).json({ message: "Profile deleted successfully" });
  } catch (error) {
    console.error("Delete profile error:", error);
    return res.status(500).json({ error: "Failed to delete profile" });
  }
}