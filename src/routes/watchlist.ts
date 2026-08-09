import { Router } from "express";
import {
  getWatchlist,
  addToWatchlist,
  removeFromWatchlist,
} from "../controllers/watchlistController";
import { authenticateToken } from "../middleware/authMiddleware";

const router = Router();

router.use(authenticateToken);

router.get("/", getWatchlist);
router.post("/", addToWatchlist);
router.delete("/:movieId", removeFromWatchlist);

export default router;