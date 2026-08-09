import { Router } from "express";
import { getProfiles, createProfile, deleteProfile } from "../controllers/profileController";
import { authenticateToken } from "../middleware/authMiddleware";

const router = Router();

// Every route here requires a valid JWT — applied to all three at once
router.use(authenticateToken);

router.get("/", getProfiles);
router.post("/", createProfile);
router.delete("/:id", deleteProfile);

export default router;