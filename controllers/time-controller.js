import { dayModel } from "../models/day-model.js";
import { getGroupById } from "./group-controller.js";

export const getDailyGroupInfo = async (date, groupId) => {
  const group = await getGroupById(groupId);
  console.log(group.name);

  const result = await dayModel.findOne(
    {
      date: new Date(date).setHours(0, 0, 0, 0),
      groups: { $elemMatch: { name: group.name } },
    },
    { "groups.$": 1 }
  );
  console.log(result.groups[0]);
  return result.groups[0];
};

export const updateDayWithMessage = async ({ message, groupName }) => {
  const today = new Date().setHours(0, 0, 0, 0);
  const now = new Date().getHours();
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
            [`groups.$[group].messagesDistribution.${now}`]: 1,
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
