import qrcode from "qrcode-terminal";
import wwbjs from "whatsapp-web.js";
import { assignActions } from "./whatsapp-web-actions.js";
import fs from "fs";
import { MongoStore } from "wwebjs-mongo";
import mongoose from "mongoose";

const { Client, RemoteAuth } = wwbjs;

export const connectWhatsappAgent = async () => {
  const store = new MongoStore({ mongoose: mongoose });
  const client = new Client({
    authStrategy: new RemoteAuth({
      store: store,
      backupSyncIntervalMs: 60000,
    }),
  });

  client.initialize();

  client.on("qr", (qr) => {
    qrcode.generate(qr, { small: true });
  });

  client.on("remote_session_saved", () => {
    console.log("session saved!");
  });

  client.on("authenticated", () => {
    console.log("Authenticated");
  });

  client.on("ready", () => {
    console.log("Client is ready!");
    client.isConnected = true;
  });

  return assignActions(client);
};
