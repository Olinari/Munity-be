import * as dotenv from "dotenv";
import express from "express";
import mongoose from "mongoose";
import api from "./index.js";
import { ServerApiVersion } from "mongodb";
import { connectWhatsappAgent } from "./whatsapp-web/whatsapp-web-agent.js";

dotenv.config();

try {
  await mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    serverApi: ServerApiVersion.v1,
  });
  console.log("Mongo Connected");

  const client = connectWhatsappAgent();
  const app = api(express(), client);
  const PORT = process.env.PORT || 5501;
  app.listen(PORT, console.log(`Server started on port ${PORT}`));
} catch (error) {
  console.error(error);
}
