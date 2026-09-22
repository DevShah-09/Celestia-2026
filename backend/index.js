import app from "./app.js";
import connectDB from "./config/database.js";
import dotenv from "dotenv";

dotenv.config();

const PORT = process.env.PORT || 3000;

// Connect to MongoDB
await connectDB();

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
