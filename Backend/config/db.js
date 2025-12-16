import mongoose from "mongoose";

let isConnected = false;

export const connectDB = async () => {
  if (isConnected) {
    return;
  }

  try {
    await mongoose.connect(process.env.MONGODB_URI);
    isConnected = true;
    console.log("Successfully connected to DB!✅");
  } catch (error) {
    console.log("Error while connecting to DB!", error.message);
  }
};
