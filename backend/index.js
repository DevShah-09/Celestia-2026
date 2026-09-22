import 'dotenv/config';
import app from "./app.js";
import connectDB from "./config/database.js";
import dotenv from "dotenv";

dotenv.config();

const PORT = process.env.PORT || 3000;

if (process.env.NODE_ENV === 'production' && (!process.env.MONGODB_URI || !process.env.JWT_SECRET || !process.env.FRONTEND_URL)) {
  throw new Error('Production requires MONGODB_URI, JWT_SECRET, and FRONTEND_URL.');
}

// Connect to MongoDB
await connectDB();

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
