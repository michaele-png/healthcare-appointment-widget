import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import nexhealthRoutes from "./routes/nexhealth.js"; // make sure this file exists

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api", nexhealthRoutes);

// Simple root route
app.get("/", (_req, res) => {
  res.send("Vemipo widget backend up");
});

// Start the server
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`Backend running on port ${PORT}`));
