import { dayModel } from "../models/day-model.js";
import { getGroupById } from "./group-controller.js";

export const getDailyGroupInfo = async (date, groupId) => {
  const group = await getGroupById(groupId);

  const result = await dayModel.findOne(
    {
      date: new Date(date).setHours(0, 0, 0, 0),
      groups: { $elemMatch: { name: group.name } },
    },
    { "groups.$": 1 }
  );

  return result?.groups[0];
};

export const getWeeklyMessageCounts = async (date, groupId) => {
  const group = await getGroupById(groupId);
  const weekEndDate = new Date(date);
  const millisecondsInDay = 24 * 60 * 60 * 1000;
  const weekStartDate = new Date(weekEndDate.getTime() - 6 * millisecondsInDay);

  try {
    const messageCounts = [];

    for (let i = 0; i < 7; i++) {
      const date = new Date(weekStartDate);
      date.setDate(date.getDate() + i);
      const day = await dayModel.findOne({
        date: date.setHours(0, 0, 0, 0),
      });
      if (day) {
        const _group = day.groups.find((g) => g.name === group.name);
        messageCounts.push(_group ? _group.messages ?? 0 : 0);
      } else {
        messageCounts.push(0);
      }
    }

    return messageCounts;
  } catch (err) {
    console.log(err);
  }
};

export const updateDayWithMessage = async ({ message, groupName }) => {
  const today = new Date().setHours(0, 0, 0, 0);
  const now = new Date().getHours();
  const userPhone = message.author.split("@")[0];

  try {
    const day = await dayModel.findOne({ date: today });

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
