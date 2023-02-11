import { connectWhatsappAgent } from "./whatsapp-web/whatsapp-web-agent.js";
import {
  syncGroups,
  getGroups,
  getGroupById,
} from "./controllers/group-controller.js";
import { getTimeline } from "./controllers/time-controller.js";

import cors from "cors";
import bodyParser from "body-parser";

export default (app, client) => {
  app.use(cors()); // parse application/x-www-form-urlencoded
  app.use(bodyParser.urlencoded({ extended: false })); // parse application/json
  app.use(bodyParser.json());

  app.post("/groups-calculator", async (req, res) => {
    if (client.isConnected) {
      console.log("Calculating Groups");
      try {
        const chats = await client.getChats();
        const groups = chats.filter((chat) => chat.isGroup);

        syncGroups(groups, client);
      } catch (error) {
        res.status(500).json({ message: "err" });
      }
    }
  });

  app.get("/groups-data", async (req, res) => {
    try {
      const data = await getGroups();
      res.send(data);
    } catch (error) {
      res.status(500).json({ message: "err" });
    }
  });

  app.get("/group-data", async (req, res) => {
    const { groupId } = req.query;

    try {
      const data = await getGroupById(groupId);
      res.send(data);
    } catch (error) {
      res.status(500).json({ message: "err" });
    }
  });

  app.get("/timeline-data", async (req, res) => {
    try {
      const data = await getTimeline();
      res.send(data);
    } catch (error) {
      res.status(500).json({ message: "err" });
    }
  });

  return app;
};
