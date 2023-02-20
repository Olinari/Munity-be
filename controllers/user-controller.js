import jwt from "jwt";
import bcrypt from "bcrypt";
import { userModel } from "../models/user-model.js";

export const registerNewUser = async (user) => {
  const alreadyExist = !!userModel.findOne({ email: user.email });
  if (alreadyExist) {
    return {
      ok: false,
      errorMessage: "User Already Exists",
    };
  }

  const password = await bcrypt.hash(user.password);

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

  const payload = {
    id: user._id,
    username: user.username,
  };

  jwt.sign(
    payload,
    process.env.JWT_SECRET,
    { expiresIn: 86400 },
    (err, token) => {
      if (err) {
        return res.json({
          ok: false,
          errorMessage: err,
        });
      }
      return res.json({
        ok: true,
        token,
      });
    }
  );
};

export const verifyJwt = (req, res, next) => {
  const token = req.headers["x-access-token"]?.split(" ")[1];
  if (!token) {
    res.json({ ok: false, message: "Incorrect Token Given" });
  }

  jwt.verify(token, process.env.PASSPORTSECRET, (err, decoded) => {
    if (err) {
      return res.json({
        ok: false,
        message: "Failed to Authenticate",
      });
    }

    req.user = {};
    req.user.id = decoded.id;
    req.user.username = decoded.username;
    next();
  });
};
