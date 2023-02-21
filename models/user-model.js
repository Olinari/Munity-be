import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
  },
  password: {
    type: String,
    required: true,
  },
  phone: { type: String },
  isGodMode: { type: Boolean },
  createdAt: { type: Date, default: Date.now },
});

export const userModel = mongoose.model("User", userSchema);
