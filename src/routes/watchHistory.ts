import { Router } from "express";
import {
  getWatchHistory,
  updateWatchProgress,
  removeFromHistory,
} from "../controllers/watchHistoryController";
import { authenticateToken } from "../middleware/authMiddleware";

const router = Router();

router.use(authenticateToken);

router.get("/", getWatchHistory);
router.post("/", updateWatchProgress);
router.delete("/:movieId", removeFromHistory);

export default router;