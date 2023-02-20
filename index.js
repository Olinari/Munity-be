import { getGroups, getGroupById } from "./controllers/group-controller.js";
import {
  getDailyGroupInfo,
  getTimeline,
  getWeeklyMessageCounts,
} from "./controllers/time-controller.js";

import cors from "cors";
import bodyParser from "body-parser";

import {
  registerUser,
  loginUser,
  verifyJwt,
} from "./controllers/user-controller";

export default (app) => {
  app.use(cors()); // parse application/x-www-form-urlencoded
  app.use(bodyParser.urlencoded({ extended: false })); // parse application/json
  app.use(bodyParser.json());

  //TODO add router for better context

  //User routes

  app.post("/register", async (req, res) => {
    const user = req.body;
    const { ok, message, errorMessage } = await registerUser(user);

    if (ok) {
      res.json({ message });
    } else {
      res.json({ message: errorMessage });
    }
  });

  app.post("/login", async (req, res) => {
    const userDetails = req.body;
    const { ok, message, errorMessage } = await loginUser(user);

    if (ok) {
      res.json({ message });
    } else {
      res.json({ message: errorMessage });
    }
  });

  app.get("get-username", verifyJwt, (req, res) => {
    res.json({ isLoggedIn: true, username: req.user.username });
  });

  //Whatsapp routes
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
