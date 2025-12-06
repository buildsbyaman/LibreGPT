import express from "express";
import thread from "../models/thread.js";
import AImodel from "../utils/AImodel.js";
const router = express.Router();

router.get("/thread", async (req, res) => {
  try {
    const threadsData = await thread.find({}).sort({ updatedAt: -1 });
    res.json(threadsData);
  } catch (error) {
    res.status(500).json({ error: "Error while fetching chats!⛔️" });
  }
});

router.get("/thread/:threadId", async (req, res) => {
  try {
    const threadId = req.params.threadId;
    const threadData = await thread.find({ threadId });
    res.json(threadData);
  } catch (error) {
    res.status(500).json({ error: "No such chat exists!⛔️" });
  }
});

router.delete("/thread/:threadId", async (req, res) => {
  try {
    const threadId = req.params.threadId;
    const threadExist = (await thread.findOne({ threadId })) ? true : false;
    if (threadExist) {
      await thread.deleteOne({ threadId });
      res.json("Successfully deleted the chat!");
    } else {
      res.status(400).json("No such chat exists!");
    }
  } catch (error) {
    res.status(500).json("Unable to delete the chat!⛔️");
  }
});

router.post("/chat", async (req, res) => {
  try {
    const { threadId, message } = req.body;
    if (!threadId || !message) {
      return res
        .status(400)
        .json({ error: "Please provide the required parameters!⛔️" });
    }
    const threadExist = (await thread.findOne({ threadId })) ? true : false;
    let threadData;
    if (threadExist) {
      threadData = await thread.findOne({ threadId });
    } else {
      const suitableTitle = await AImodel([
        {
          role: "user",
          content: `strictly rephrase this "${message}" in 3 words and output only 3 words and nothing else.`,
        },
      ]);
      threadData = new thread({ threadId, title: suitableTitle });
    }

    const messagesWithHistory = [
      ...threadData.messages.map((msg) => ({
        role: msg.role,
        content: msg.content,
      })),
      { role: "user", content: message },
    ];

    const AIresponse = await AImodel(messagesWithHistory);
    threadData.messages.push({ role: "user", content: message });
    threadData.messages.push({
      role: "assistant",
      content: AIresponse,
      timestamp: Date.now(),
    });
    await threadData.save();
    res.json(AIresponse);
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Some error occurred at server side!⛔️" });
  }
});

export default router;
