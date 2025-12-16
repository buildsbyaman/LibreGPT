import express from "express";
import User from "../models/user.js";
import passport from "passport";
import { userSchema } from "../schema.js";

const router = express.Router();

const userSchemaValidator = (req, res, next) => {
  const { error } = userSchema.validate(req.body);
  if (error) {
    return res.status(400).json({ message: "Please provide all details!" });
  }
  next();
};

router.post("/status", (req, res) => {
  if (res.locals.currUser) {
    res.status(200).json({ loginStatus: true });
  } else {
    res.status(200).json({ loginStatus: false });
  }
});

router.post("/login", (req, res, next) => {
  passport.authenticate("local", (err, user, info) => {
    if (err) {
      return res.status(500).json({
        message: "An error occurred during authentication",
        success: false,
      });
    }
    if (!user) {
      return res.status(401).json({
        message: info?.message || "Invalid username or password!",
        success: false,
      });
    }
    req.logIn(user, (err) => {
      if (err) {
        return res.status(500).json({
          message: "Login failed. Please try again.",
          success: false,
        });
      }
      return res.status(200).json({
        message: "Successfully logged in!✅",
        success: true,
      });
    });
  })(req, res, next);
});

router.post("/signup", userSchemaValidator, async (req, res) => {
  try {
    const { username, password } = req.body;
    const isUsernameTaken = (await User.findOne({ username })) ? true : false;
    if (isUsernameTaken) {
      res.status(500).json({
        message: "Username already taken! Please try a new one.",
        success: "false",
        usernameTaken: "true",
      });
    } else {
      const newUser = await User.register(new User({ username }), password);
      req.login(newUser, (error) => {
        if (error) {
          res.status(400).json({
            message:
              "Account created successfully but unable to login you automatically! Please login manually.",
            success: "false",
          });
        }
      });
      res.status(200).json({
        message: "Successfully created a new account!✅",
        success: "true",
      });
    }
  } catch (error) {
    res.status(400).json({
      message: "Unable to create a new account!",
      success: "false",
    });
  }
});

router.post("/logout", (req, res) => {
  req.logout((err) => {
    if (err) {
      return res
        .status(500)
        .json({ message: "Unable to logout.", success: "false" });
    } else {
      res.clearCookie("connect.sid");
      res
        .status(200)
        .json({ message: "Successfully logged out.", success: "true" });
    }
  });
});

router.delete("/delete", userSchemaValidator, async (req, res) => {
  try {
    const userId = res.locals.user.id;
    const isUserDeleted = (await User.findByIdAndDelete({ userId }))
      ? true
      : false;
    if (isUserDeleted) {
      res.status(200).json({ message: "Account deleted successfully!✅" });
    } else {
      res.status(200).json({ message: "No account found!" });
    }
  } catch (error) {
    res.status(500).json({ message: "Unable to delete the account!" });
  }
});

export default router;
