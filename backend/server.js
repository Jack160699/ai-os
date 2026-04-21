import express from "express";
import dotenv from "dotenv";
import webhookRoute from "./routes/webhook.js";

dotenv.config();

const app = express();
app.use(express.json());

app.use("/webhook", webhookRoute);

app.get("/", (req, res) => {
  res.send("Server running");
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log("Server running on port " + PORT);
});
