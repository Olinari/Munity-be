import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import { userModel } from "../models/user-model.js";

export const registerUser = async (user) => {
  const alreadyExist = await userModel.findOne({ email: user.email });
  console.log(user, alreadyExist);
  if (alreadyExist) {
    return {
      ok: false,
      errorMessage: "User Already Exists",
    };
  }

  const password = await bcrypt.hash(user.password, 10);

  new userModel({
    email: user.email,
    password,
  }).save();

  return { ok: true };
};

export const loginUser = async (userDetails) => {
  const user = await userModel.findOne({ username: userDetails.username });
  if (!user) {
    return {
      ok: false,
      errorMessage: "Invalid Username or Password",
    };
  }

  const isPasswordOk = await bcrypt.compare(
    userDetails.password,
    user.password
  );

  if (!isPasswordOk) {
    return {
      ok: false,
      errorMessage: "Invalid Username or Password",
    };
  }

  return {
    ok: true,
    payload: { id: user._id, username: user.username },
  };
};

export const verifyJwt = (req, res, next) => {
  let token = req.headers["x-access-token"];

  if (!token) {
    res.json({ ok: false, message: "Incorrect Token Given" });
  }

  jwt.verify(token, process.env.JWT_KEY, (err, decoded) => {
    if (err) {
      console.log(err);
      return res.json({
        ok: false,
        message: "Failed to Authenticate",
      });
    }

    req.user = {};
    req.user.id = decoded.id;
    next();
  });
};
