import express from "express";
import cors from "cors";
import "dotenv/config";
import threadRouter from "./routes/thread.js";
import { rateLimit } from "express-rate-limit";
import { connectDB } from "./config/db.js";

const app = express();
const PORT = process.env.PORT || 8080;

app.set("trust proxy", 1);

app.use(
  cors({
    origin: [
      "https://buildsbyaman-libregpt.vercel.app",
      "http://localhost:5173",
    ],
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const limiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  limit: 1000,
  message: "Too many requests! Try again in 1 minute.",
});

app.use(limiter);

app.use(async (req, res, next) => {
  await connectDB();
  next();
});

app.use("/api", threadRouter);

app.listen(PORT, () => {
  console.log(`Server successfully started on ${PORT}!✅`);
  connectDB();
});
