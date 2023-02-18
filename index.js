import { getGroups, getGroupById } from "./controllers/group-controller.js";
import {
  getDailyGroupInfo,
  getTimeline,
  getWeeklyMessageCounts,
} from "./controllers/time-controller.js";

import cors from "cors";
import bodyParser from "body-parser";

export default (app, client) => {
  app.use(cors()); // parse application/x-www-form-urlencoded
  app.use(bodyParser.urlencoded({ extended: false })); // parse application/json
  app.use(bodyParser.json());

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

  app.get("/group-daily-data", async (req, res) => {
    const { date, groupId } = req.query;
    try {
      const data = await getDailyGroupInfo(date, groupId);
      res.send(data);
    } catch (error) {
      res.status(500).json({ message: "err" });
    }
  });

  app.get("/group-weekly-data", async (req, res) => {
    const { date, groupId } = req.query;

    try {
      const data = await getWeeklyMessageCounts(date, groupId);
      date, groupId;
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
