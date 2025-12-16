import mongoose from "mongoose";
import passportLocalMongoose from "passport-local-mongoose";

const userSchema = new mongoose.Schema({
  allThreads: [
    {
      type: String,
      default: "",
    },
  ],
});

userSchema.plugin(passportLocalMongoose);

const User = mongoose.model("user", userSchema);

export default User;
