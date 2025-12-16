import express from "express";
import thread from "../models/thread.js";
import AImodel from "../utils/AImodel.js";
import { threadSchema } from "../schema.js";

const router = express.Router();

const threadSchemaValidator = (req, res, next) => {
  const { error } = threadSchema.validate(req.body);
  if (error) {
    console.log(error);
    return res.status(400).json({ message: "Please provide all details!" });
  }
  next();
};

router.get("/thread", async (req, res) => {
  try {
    const threadsData = await thread.find({}).sort({ updatedAt: -1 });
    res.json(threadsData);
  } catch (error) {
    res.status(500).json({ error: "Error while fetching chats!" });
  }
});

router.get("/thread/:threadId", async (req, res) => {
  try {
    const threadId = req.params.threadId;
    const threadData = await thread.find({ threadId });
    res.json(threadData);
  } catch (error) {
    res.status(500).json({ error: "No such chat exists!" });
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
    res.status(500).json("Unable to delete the chat!");
  }
});

router.post("/chat", threadSchemaValidator, async (req, res) => {
  try {
    const { threadId, message } = req.body;
    const threadExist = (await thread.findOne({ threadId })) ? true : false;
    let threadData;

    if (threadExist) {
      threadData = await thread.findOne({ threadId });

      const messagesWithHistory = [
        ...threadData.messages.map((msg) => ({
          role: msg.role,
          content: msg.content,
        })),
        { role: "user", content: message },
      ];

      const AIresponse = await AImodel(messagesWithHistory, req.body.model);

      threadData.messages.push({ role: "user", content: message });
      threadData.messages.push({
        role: "assistant",
        content: AIresponse,
        timestamp: Date.now(),
      });
      await threadData.save();
      res.json(AIresponse);
    } else {
      const messagesWithHistory = [{ role: "user", content: message }];

      const [suitableTitle, AIresponse] = await Promise.all([
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

      await threadData.save();
      res.json(AIresponse);
    }
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Some error occurred at server side!" });
  }
});

export default router;
