import OpenAI from "openai";

const client = new OpenAI({
  baseURL: "https://openrouter.ai/api/v1",
  apiKey: process.env.OPENROUTER_API_KEY,
});

const AImodel = async (messages) => {
  try {
    const apiResponse = await client.chat.completions.create({
      model: "tngtech/deepseek-r1t2-chimera:free",
      messages: messages,
    });
    return apiResponse.choices[0].message.content;
  } catch (error) {
    console.log(error);
    return "Error occurred while getting response from AI model!⛔️";
  }
};

export default AImodel;
