import { connectAgent } from "./whatsapp-web/whatsapp-web-agent.js";
import {
  syncGroups,
  getGroups,
  getGroupById,
} from "./controllers/group-controller.js";
import { getTimeline } from "./controllers/time-controller.js";

import cors from "cors";
import bodyParser from "body-parser";

const whatsappAgent = { isConnected: false };

export default (app) => {
  app.use(cors()); // parse application/x-www-form-urlencoded
  app.use(bodyParser.urlencoded({ extended: false })); // parse application/json
  app.use(bodyParser.json());

  app.get("/connect-agent", async (req, res) => {
    if (!whatsappAgent.isConnected) {
      try {
        const { getAuthData, createClient } = connectAgent();
        const authData = await getAuthData();

        if (authData.qr) {
          res.send({ qr: authData.qr });
        }

        const { isConnected, client } = await createClient();
        whatsappAgent.isConnected = isConnected;
        whatsappAgent.client = client;
      } catch (error) {
        console.log(error);
        res.status(500).json({ message: error.message });
      }
    }
  });

  app.get("/secure-connection", async (req, res) => {
    try {
      res.send({ connected: whatsappAgent.isConnected });
    } catch (error) {
      console.log(error);
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/disconnect", async (req, res) => {
    console.log("bye bye");
    whatsappAgent.isConnected = false;
    whatsappAgent.client = null;
  });

  app.post("/groups-calculator", async (req, res) => {
    if (whatsappAgent.isConnected) {
      console.log("Calculating Groups");
      try {
        const chats = await whatsappAgent.client.getChats();
        const groups = chats.filter((chat) => chat.isGroup);

        syncGroups(groups, whatsappAgent.client);
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
