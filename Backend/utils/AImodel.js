import OpenAI from "openai";

const clientPrimary = new OpenAI({
  baseURL: "https://openrouter.ai/api/v1",
  apiKey: process.env.OPENROUTER_API_KEY,
});

const clientAlternate = process.env.OPENROUTER_ALTERNATE_KEY
  ? new OpenAI({
      baseURL: "https://openrouter.ai/api/v1",
      apiKey: process.env.OPENROUTER_ALTERNATE_KEY,
    })
  : null;

let cachedFreeModels = null;
let cacheTimestamp = 0;
const CACHE_DURATION = 10 * 60 * 1000;


const fetchFreeModels = async () => {
  const now = Date.now();

  if (cachedFreeModels && now - cacheTimestamp < CACHE_DURATION) {
    return cachedFreeModels;
  }

  try {
    let response = await fetch("https://openrouter.ai/api/v1/models", {
      headers: {
        Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
      },
    });

    if (!response.ok && process.env.OPENROUTER_ALTERNATE_KEY) {
      response = await fetch("https://openrouter.ai/api/v1/models", {
        headers: {
          Authorization: `Bearer ${process.env.OPENROUTER_ALTERNATE_KEY}`,
        },
      });
    }

    if (!response.ok) {
      throw new Error(`OpenRouter API error: ${response.status}`);
    }

    const data = await response.json();

    const freeModels = data.data
      .filter((model) => {
        const id = model.id.toLowerCase();
        return id.endsWith(":free") &&
               !id.includes("google") &&
               !id.includes("meta") &&
               !id.includes("gemma") &&
               !id.includes("llama");
      })
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
      { id: "deepseek/deepseek-chat-v3-0324:free", name: "Deepseek" },
      { id: "openai/gpt-oss-120b:free", name: "ChatGPT" },
      { id: "amazon/nova-2-lite-v1:free", name: "Nova 2 Lite" },
    ];
  }
};

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const getFallbackModels = () => {
  if (cachedFreeModels && cachedFreeModels.length > 0) {
    return cachedFreeModels.map((m) => m.id);
  }
  return [
    "deepseek/deepseek-chat-v3-0324:free",
    "openai/gpt-oss-120b:free",
    "amazon/nova-2-lite-v1:free",
  ];
};

const AImodel = async (messages, model, options = {}) => {
  let selectedModelName = model || "deepseek/deepseek-chat-v3-0324:free";
  const maxRetries = options.maxRetries ?? 2;
  let delayMs = options.initialDelayMs ?? 500;
  
  const triedModels = options.triedModels || new Set();
  triedModels.add(selectedModelName);

  const clientToUse = (options.useAlternateKey && clientAlternate) ? clientAlternate : clientPrimary;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const apiResponse = await clientToUse.chat.completions.create({
        model: selectedModelName,
        messages: messages,
      });
      return apiResponse.choices[0].message.content;
    } catch (error) {
      console.error(`Error on attempt ${attempt + 1} using ${options.useAlternateKey ? 'alternate' : 'primary'} key for model ${selectedModelName}:`, error);

      const status = error.status || error.statusCode || (error.error && error.error.code) || error.code;
      const isRateLimit = status === 429 || status === "429" || 
                          (error.message && error.message.includes("429")) || 
                          (error.error && error.error.message && error.error.message.includes("rate limit"));

      if (isRateLimit && attempt < maxRetries) {
        console.log(`Rate limit hit. Retrying ${selectedModelName} in ${delayMs}ms...`);
        await delay(delayMs);
        delayMs *= 2;
        continue;
      }

      // If we are rate limited on the primary key, try switching to the alternate key for the same model
      if (isRateLimit && !options.useAlternateKey && clientAlternate) {
        console.log(`Switching to alternate key for model ${selectedModelName}...`);
        return AImodel(messages, selectedModelName, {
          ...options,
          useAlternateKey: true,
          maxRetries: 1,
          initialDelayMs: 500,
        });
      }

      // If rate limited even on alternate key (or alternate key not available), try a different free fallback model
      if (isRateLimit) {
        const fallbackModels = getFallbackModels();
        const nextModel = fallbackModels.find((m) => !triedModels.has(m));
        if (nextModel) {
          console.log(`Model ${selectedModelName} rate limited. Falling back to next free model: ${nextModel}...`);
          return AImodel(messages, nextModel, {
            ...options,
            triedModels,
            useAlternateKey: false, // Reset to primary key for the new model
            maxRetries: 1,
            initialDelayMs: 500,
          });
        }
      }

      // Final error handling if all attempts/fallbacks failed or it's a different error
      if (isRateLimit) {
        return "All free models/API keys are currently rate-limited. Please try again in a few moments.";
      } else {
        return "API Keys Expired! Please contact the admin.";
      }
    }
  }
};

export { fetchFreeModels };
export default AImodel;
