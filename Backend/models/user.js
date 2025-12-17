import mongoose from "mongoose";
import passportLocalMongoose from "passport-local-mongoose";

const userSchema = new mongoose.Schema({
  threads: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "thread",
    },
  ],
});

userSchema.plugin(passportLocalMongoose);

const User = mongoose.model("user", userSchema);

export default User;
