import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import authRoutes from "./routes/auth";
import profileRoutes from "./routes/profiles";
import watchlistRoutes from "./routes/watchlist";
import favoriteRoutes from "./routes/favorites";
import watchHistoryRoutes from "./routes/watchHistory";


dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware — must come before any routes that depend on them
app.use(cors());
app.use(express.json());

// Test route
app.get("/", (req, res) => {
  res.json({ message: "Streamify API is running!" });
});

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/profiles", profileRoutes);
app.use("/api/watchlist", watchlistRoutes);
app.use("/api/favorites", favoriteRoutes);
app.use("/api/watch-history", watchHistoryRoutes);

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});