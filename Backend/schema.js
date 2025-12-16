import Joi from "joi";

const userSchema = Joi.object({
  username: Joi.string().required(),
  password: Joi.string().required(),
})
  .unknown(false)
  .required();

const threadSchema = Joi.object({
  threadId: Joi.string().required(),
  message: Joi.string().required(),
  model: Joi.string().required(),
})
  .required()
  .unknown(false);

export { userSchema, threadSchema };
