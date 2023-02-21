import { getGroups, getGroupById } from "./controllers/group-controller.js";
import {
  getDailyGroupInfo,
  getTimeline,
  getWeeklyMessageCounts,
} from "./controllers/time-controller.js";
import jwt from "jsonwebtoken";
import cors from "cors";
import bodyParser from "body-parser";

import {
  registerUser,
  loginUser,
  verifyJwt,
} from "./controllers/user-controller.js";

export default (app) => {
  app.use(cors()); // parse application/x-www-form-urlencoded
  app.use(bodyParser.urlencoded({ extended: false })); // parse application/json
  app.use(bodyParser.json());

  //TODO add router for better context

  //User routes

  app.post("/register", async (req, res) => {
    const { user } = req.body;

    const { ok, message, errorMessage } = await registerUser(user);
    console.log(errorMessage);
    if (ok) {
      res.json({ message });
    } else {
      res.status(500).send({ error: errorMessage });
    }
  });

  app.post("/login", async (req, res) => {
    const { user } = req.body;
    console.log(await loginUser(user));
    const { ok, payload, errorMessage } = await loginUser(user);

    if (ok) {
      return jwt.sign(
        payload,
        process.env.JWT_KEY,
        { expiresIn: 86400 },
        (err, token) => {
          if (err) {
            return res.status(500).send({ error: err });
          }
          return res.send({
            ok: true,
            token,
          });
        }
      );
    } else {
      res.status(500).send({ error: errorMessage });
    }
  });

  app.get("/restore-login", verifyJwt, (req, res) => {
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
