import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  phone: { type: String, required: true, unique: true },
  createdAt: { type: Date, default: Date.now },
});

export const userModel = mongoose.model("User", userSchema);
