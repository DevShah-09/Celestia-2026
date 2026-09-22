import express from "express";
import bodyParser from "body-parser";
import cors from "cors";
import routes from "./routes/index.js";

const app = express();

// Middleware
const allowedOrigins = process.env.FRONTEND_URL?.split(',').map(origin => origin.trim()).filter(Boolean);
app.use(cors({ origin: allowedOrigins?.length ? allowedOrigins : true }));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Routes
app.use("/api", routes);

app.get("/", (_req, res) => {
  res.status(200).json({
    message: "Welcome to Celestia 2026 API! 🌟",
  });
});

export default app;
