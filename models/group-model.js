import mongoose from "mongoose";

const participantSchema = new mongoose.Schema({
  phone: { type: String, required: true },
  isAdmin: { type: Boolean },
  messages: { type: Number },
  profilePicUrl: { type: String },
});

export const groupSchema = new mongoose.Schema({
  name: { type: String },
  participants: { type: Array },
  createdAt: { type: Date },
  subject: { type: String },
  ownerPhone: { type: String },
  adminProfilePic: { type: String },
  groupProfilePic: { type: String },
  ownerSerialized: { type: String },
  participants: { type: [participantSchema] },
  messages: { type: Number },
  messagesDisterbution: {
    type: [Number],
    default: Array(24).fill(0),
  },
  topContributor: {
    type: participantSchema,
  },
});

export const groupModel = mongoose.model("Group", groupSchema);
