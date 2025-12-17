import express from "express";
import thread from "../models/thread.js";
import AImodel from "../utils/AImodel.js";
import { threadSchema } from "../schema.js";
import User from "../models/user.js";

const router = express.Router();

const threadSchemaValidator = (req, res, next) => {
  const { error } = threadSchema.validate(req.body);
  if (error) {
    return res
      .status(400)
      .json({ message: "Invalid input data", details: error.details });
  }
  next();
};

router.get("/thread", async (req, res) => {
  try {
    if (req.user) {
      const currUserThreadsData = await User.findById(
        res.locals.currUser._id
      ).populate("threads");
      res.json(currUserThreadsData.threads || []);
    } else {
      res.status(401).json({ warning: "Please login to save chats!" });
    }
  } catch (error) {
    res.status(500).json({ error: "Error while fetching chats!" });
  }
});

router.get("/thread/:threadId", async (req, res) => {
  try {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Please login to access chats!" });
    }
    const threadId = req.params.threadId;
    const threadData = await thread.findOne({ threadId });
    if (!threadData) {
      return res.status(404).json({ error: "No such chat exists!" });
    }
    // Verify thread belongs to current user
    const currUser = await User.findById(res.locals.currUser._id);
    const ownsThread = currUser.threads.some(
      (id) => id.toString() === threadData._id.toString()
    );
    if (!ownsThread) {
      return res.status(403).json({ error: "Access denied!" });
    }
    res.json([threadData]);
  } catch (error) {
    res.status(500).json({ error: "Error fetching chat!" });
  }
});

router.delete("/thread/:threadId", async (req, res) => {
  try {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Please login to delete chats!" });
    }
    const threadId = req.params.threadId;
    const threadDoc = await thread.findOne({ threadId });
    if (!threadDoc) {
      return res.status(404).json({ error: "No such chat exists!" });
    }
    const currUser = await User.findById(res.locals.currUser._id);
    const ownsThread = currUser.threads.some(
      (id) => id.toString() === threadDoc._id.toString()
    );
    if (!ownsThread) {
      return res.status(403).json({ error: "Access denied!" });
    }
    await User.findByIdAndUpdate(res.locals.currUser._id, {
      $pull: { threads: threadDoc._id },
    });
    await thread.deleteOne({ threadId });
    res.json({ success: true, message: "Successfully deleted the chat!" });
  } catch (error) {
    res.status(500).json({ error: "Unable to delete the chat!" });
  }
});

router.post("/chat", threadSchemaValidator, async (req, res) => {
  try {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Please login to use chat!" });
    }
    const { threadId, message } = req.body;
    const threadExist = (await thread.findOne({ threadId })) ? true : false;
    let threadData;
    let AIresponse = null;

    if (threadExist) {
      threadData = await thread.findOne({ threadId });

      const messagesWithHistory = [
        ...threadData.messages.map((msg) => ({
          role: msg.role,
          content: msg.content,
        })),
        { role: "user", content: message },
      ];

      AIresponse = await AImodel(messagesWithHistory, req.body.model);

      threadData.messages.push({ role: "user", content: message });
      threadData.messages.push({
        role: "assistant",
        content: AIresponse,
        timestamp: Date.now(),
      });
      if (req.isAuthenticated()) {
        const currUser = await User.findById(res.locals.currUser._id);
        const threadExistsInUser = currUser.threads.some(
          (id) => id.toString() === threadData._id.toString()
        );
        if (!threadExistsInUser) {
          currUser.threads.push(threadData._id);
          await currUser.save();
        }
      }
      await threadData.save();
      res.json(AIresponse);
    } else {
      const messagesWithHistory = [{ role: "user", content: message }];
      let suitableTitle = null;
      [suitableTitle, AIresponse] = await Promise.all([
        AImodel([
          {
            role: "user",
            content: `strictly rephrase this "${message}" in 3 words and output only 3 words and nothing else.`,
          },
        ]),
        AImodel(messagesWithHistory, req.body.model),
      ]);

      threadData = new thread({
        threadId,
        title: suitableTitle,
        messages: [
          { role: "user", content: message },
          { role: "assistant", content: AIresponse, timestamp: Date.now() },
        ],
      });
      if (req.isAuthenticated()) {
        const currUser = await User.findById(res.locals.currUser._id);
        currUser.threads.push(threadData._id);
        await currUser.save();
      }
      await threadData.save();
      res.json(AIresponse);
    }
  } catch (error) {
    res.status(500).json({ error: "Unable to process request" });
  }
});

export default router;
