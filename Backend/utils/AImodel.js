import OpenAI from "openai";

const client = new OpenAI({
  baseURL: "https://openrouter.ai/api/v1",
  apiKey: process.env.OPENROUTER_API_KEY,
});

const AImodel = async (messages, model) => {
  let selectedModelName = "tngtech/deepseek-r1t2-chimera:free"; //default model as Deepseek

  switch (model) {
    case "ChatGPT":
      selectedModelName = "openai/gpt-oss-120b:free";
      break;
    case "Gemini":
      selectedModelName = "google/gemini-2.0-flash-exp:free";
      break;
    case "Nova2":
      selectedModelName = "amazon/nova-2-lite-v1:free";
      break;
    default:
      selectedModelName = "tngtech/deepseek-r1t2-chimera:free";
  }

  try {
    const apiResponse = await client.chat.completions.create({
      model: selectedModelName,
      messages: messages,
    });
    return apiResponse.choices[0].message.content;
  } catch (error) {
    console.log(error);
    if (error.code === 429) {
      return "Rate Limit reached! Please try again in a few moments OR use another model.";
    } else {
      return "Error occurred while getting response from AI model!";
    }
  }
};

export default AImodel;
