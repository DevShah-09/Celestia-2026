import mongoose from "mongoose";

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(
      process.env.MONGODB_URI || "mongodb://localhost:27017/celestia", { serverSelectionTimeoutMS: 10000 }
    );
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`Error: ${error.message}`);
    console.error("API startup stopped: MongoDB is unavailable. For Atlas, check the cluster status, current public IP in Network Access, database credentials, and outbound network access.");
    process.exit(1);
  }
};

export default connectDB;
