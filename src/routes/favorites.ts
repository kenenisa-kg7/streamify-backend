import { Router } from "express";
import {
  getFavorites,
  addToFavorites,
  removeFromFavorites,
} from "../controllers/favoriteController";
import { authenticateToken } from "../middleware/authMiddleware";

const router = Router();

router.use(authenticateToken);

router.get("/", getFavorites);
router.post("/", addToFavorites);
router.delete("/:movieId", removeFromFavorites);

export default router;