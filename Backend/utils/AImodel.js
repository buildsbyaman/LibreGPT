import OpenAI from "openai";

const client = new OpenAI({
  baseURL: "https://openrouter.ai/api/v1",
  apiKey: process.env.OPENROUTER_API_KEY,
});

let cachedFreeModels = null;
let cacheTimestamp = 0;
const CACHE_DURATION = 10 * 60 * 1000;


const fetchFreeModels = async () => {
  const now = Date.now();

  if (cachedFreeModels && now - cacheTimestamp < CACHE_DURATION) {
    return cachedFreeModels;
  }

  try {
    const response = await fetch("https://openrouter.ai/api/v1/models", {
      headers: {
        Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
      },
    });

    if (!response.ok) {
      throw new Error(`OpenRouter API error: ${response.status}`);
    }

    const data = await response.json();

    const freeModels = data.data
      .filter((model) => model.id.endsWith(":free"))
      .map((model) => ({
        id: model.id,
        name: (model.name || model.id.split("/").pop().replace(":free", "")).replace(/\s*\(free\)/gi, "").trim(),
      }))
      .sort((a, b) => a.name.localeCompare(b.name));

    cachedFreeModels = freeModels;
    cacheTimestamp = now;

    return freeModels;
  } catch (error) {
    console.error("Error fetching free models from OpenRouter:", error);
    return [
      { id: "openai/gpt-oss-120b:free", name: "ChatGPT" },
      { id: "google/gemini-2.0-flash-exp:free", name: "Gemini" },
      { id: "deepseek/deepseek-chat-v3-0324:free", name: "Deepseek" },
      { id: "amazon/nova-2-lite-v1:free", name: "Nova 2 Lite" },
      { id: "meta-llama/llama-3.3-70b-instruct:free", name: "Llama 3.3 70B" },
    ];
  }
};

const AImodel = async (messages, model) => {
  let selectedModelName = model || "google/gemini-2.0-flash-exp:free";

  try {
    const apiResponse = await client.chat.completions.create({
      model: selectedModelName,
      messages: messages,
    });
    return apiResponse.choices[0].message.content;
  } catch (error) {
    console.log("error", error);
    if (error.code === 429) {
      return "Rate Limit reached! Please try again in a few moments OR use another model.";
    } else {
      return "API Keys Expired! Please contact the admin.";
    }
  }
};

export { fetchFreeModels };
export default AImodel;
