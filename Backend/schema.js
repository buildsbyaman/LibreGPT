import Joi from "joi";

const userSchema = Joi.object({
  username: Joi.string().alphanum().min(3).max(30).trim().required(),
  password: Joi.string().min(6).max(128).required(),
})
  .unknown(false)
  .required();

const threadSchema = Joi.object({
  threadId: Joi.string().uuid().required(),
  message: Joi.string().min(1).max(10000).trim().required(),
  model: Joi.string()
    .valid("ChatGPT", "Gemini", "Nova2", "Deepseek")
    .required(),
})
  .required()
  .unknown(false);

export { userSchema, threadSchema };
