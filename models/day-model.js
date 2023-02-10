import mongoose from "mongoose";

const daySchema = new mongoose.Schema({
  date: { type: Date, required: true, unique: true },
  groups: [
    {
      name: { type: String },
      messages: { type: Number, default: 1 },
      participants: [
        {
          userPhone: { type: String, required: true },
          messages: { type: Number, default: 1 },
        },
      ],
    },
  ],
});

export const dayModel = mongoose.model("Day", daySchema);
