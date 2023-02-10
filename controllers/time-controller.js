import { dayModel } from "../models/day-model.js";

export const updateDayWithMessage = async ({ message, groupName }) => {
  const today = new Date().setHours(0, 0, 0, 0);
  const userPhone = message.author.split("@")[0];

  try {
    const day = await dayModel.findOne({ date: today });
    console.log(day);
    if (!day) {
      const newDay = new dayModel({
        date: today,
        groups: [
          {
            name: groupName,
            messages: 1,
            participants: {
              userPhone,
              messages: 1,
            },
          },
        ],
      });
      await newDay.save();
    } else {
      await day.update(
        {
          $inc: {
            "groups.$[group].messages": 1,
            "groups.$[group].participants.$[participant].messages": 1,
          },
        },
        {
          arrayFilters: [
            { "group.name": groupName },
            { "participant.userPhone": userPhone },
          ],
          upsert: true,
        }
      );
    }
  } catch (error) {
    console.error(error);
  }
};

export const getTimeline = async () => await dayModel.find();
