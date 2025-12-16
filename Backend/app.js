import express from "express";
import cors from "cors";
import "dotenv/config";
import threadRouter from "./routes/thread.js";
import userRouter from "./routes/user.js";
import { rateLimit } from "express-rate-limit";
import { connectDB } from "./config/db.js";
import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import User from "./models/user.js";
import session from "express-session";
import MongoStore from "connect-mongo";

const app = express();
const PORT = process.env.PORT || 8080;

await connectDB();

app.set("trust proxy", 1);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(
  cors({
    origin: [
      "https://buildsbyaman-libregpt.vercel.app",
      "http://localhost:5173",
    ],
    credentials: true,
  })
);

const limiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  limit: 1000,
  message: "Too many requests! Try again in 1 minute.",
});

app.use(session({
  name: "sid",
  store: MongoStore.create({
    mongoUrl: process.env.MONGODB_URI,
    ttl: 14 * 24 * 60 * 60
  }),
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    secure: true,
    sameSite: "none",
    path: "/"
  }
}))

app.use(passport.initialize());
app.use(passport.session());

passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.use((req, res, next) => {
  res.locals.user = req.user || null;
  next();
});

app.use(limiter);

app.use("/api", threadRouter);
app.use("/api/user", userRouter);

app.listen(PORT, () => {
  console.log(`Server successfully started on ${PORT}!✅`);
  connectDB();
});
