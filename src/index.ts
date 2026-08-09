import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import authRoutes from "./routes/auth";
import profileRoutes from "./routes/profiles";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
// ... below your existing app.use("/api/auth", authRoutes);
app.use("/api/profiles", profileRoutes);

// Test route
app.get("/", (req, res) => {
  res.json({ message: "Streamify API is running!" });
});

// Auth routes
app.use("/api/auth", authRoutes);

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});