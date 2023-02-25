import qrcode from "qrcode-terminal";
import wwbjs from "whatsapp-web.js";
import { assignActions } from "./whatsapp-web-actions.js";
import { syncGroups } from "../controllers/group-controller.js";
import { MongoStore } from "wwebjs-mongo";
import mongoose from "mongoose";

const { Client, RemoteAuth } = wwbjs;

export const connectWhatsappAgent = async () => {
  const store = new MongoStore({ mongoose: mongoose });
  const client = new Client({
    puppeteer: { args: ["--no-sandbox"] },
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

  client.on("disconnected", () => {
    clearInterval(client.ClearId);
    console.log("bye");
  });

  client.on("ready", () => {
    console.log("Client is ready!");

    client.ClearId = setInterval(async () => {
      try {
        console.log("Calculating Groups");
        const chats = await client.getChats();
        const groups = chats.filter((chat) => chat.isGroup);
        syncGroups(groups, client);
      } catch (error) {
        console.log(error);
      }
    }, 5000000);
  });

  return assignActions(client);
};
