import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();
const app = express();
app.use(cors({ origin: "http://localhost:5173" }));
app.use(express.json());

const calculationSchema = new mongoose.Schema({
  expression: { type: String, required: true },
  result: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});
const Calculation = mongoose.model("Calculation", calculationSchema);

app.get("/api/health", (_req, res) => res.json({ status: "ok", database: mongoose.connection.readyState === 1 ? "connected" : "disconnected" }));

app.get("/api/history", async (_req, res) => {
  try {
    if (mongoose.connection.readyState !== 1) return res.json([]);
    const history = await Calculation.find().sort({ createdAt: -1 }).limit(30);
    res.json(history);
  } catch (error) { res.status(500).json({ message: "Could not load history." }); }
});

app.post("/api/history", async (req, res) => {
  try {
    const { expression, result } = req.body;
    if (typeof expression !== "string" || typeof result !== "string" || !expression.trim() || !result.trim()) {
      return res.status(400).json({ message: "Expression and result are required." });
    }
    if (mongoose.connection.readyState !== 1) return res.status(503).json({ message: "MongoDB is not connected. Calculation still works locally." });
    const item = await Calculation.create({ expression, result });
    res.status(201).json(item);
  } catch (error) { res.status(500).json({ message: "Could not save calculation." }); }
});

const PORT = process.env.PORT || 5000;
if (process.env.MONGO_URI) {
  mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log("MongoDB connected"))
    .catch(err => console.error("MongoDB connection failed:", err.message));
}
app.listen(PORT, () => console.log(`API running at http://localhost:${PORT}`));
