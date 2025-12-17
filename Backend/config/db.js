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

export const getDBStatus = () => {
  return {
    connected: isConnected && mongoose.connection.readyState === 1,
    state: mongoose.connection.readyState,
  };
};
