import { groupModel } from "../models/group-model.js";
import { api } from "../api.js";

setInterval(() => {
  api.post(`groups-calculator`);
}, 20000);

export const syncGroups = (groups, client) => {
  groups.forEach(async (group) => {
    if (group.groupMetadata?.owner) {
      //groups older than 7 years are not supported (missing owner field)
      const {
        groupMetadata: {
          subject,
          createdAt,
          participants,
          owner: { user: ownerPhone, _serialized: ownerSerialized },
          id: { user: groupId },
        },
      } = group;

      const filter = { name: groupId };

      try {
        const currentGroup = await groupModel.findOne(filter);

        await groupModel.findOneAndUpdate(filter, {
          name: groupId,
          createdAt,
          subject,
          ownerPhone,
          ownerSerialized,
          adminProfilePic: await client.getProfilePicUrl(ownerSerialized),
          topContributorIndex: currentGroup.participants.reduce(
            (maxIndex, participant, currentIndex) => {
              return participant.messages >
                currentGroup.participants[maxIndex].messages
                ? currentIndex
                : maxIndex;
            },
            0
          ),
          participants: participants.map(
            ({ id, isAdmin, isSuperAdmin }, index) => ({
              phone: id.user,
              isAdmin,
              isSuperAdmin,
              profilePic: client.getProfilePicUrl(`${id.user}@c.us`),
              messages: currentGroup.participants?.[index]?.messages,
            })
          ),
        });
      } catch (error) {
        console.error(error);
      }
    }
  });
};

export const updateGroupWithMessage = async (message) => {
  const name = message.from.split("@")[0];
  const userPhone = message.author.split("@")[0];
  const now = new Date().getHours();

  try {
    //update total number of messages
    await groupModel.updateOne(
      { name }, //message 'from' field holds the group id
      {
        $inc: { messages: 1 },
      },
      { upsert: true }
    );

    //update participant's number of messages sent in the group
    await groupModel.findOneAndUpdate(
      { name },
      {
        $inc: {
          "participants.$[participant].messages": 1,
          [`messagesDisterbution.${now}`]: 1,
        },
      },
      {
        arrayFilters: [{ "participant.phone": userPhone }],
        upsert: true,
      }
    );

    return name;
  } catch (error) {
    console.error(error);
  }
};

export const getGroups = async () => await groupModel.find();

export const getGroupById = async (id) => {
  console.log(id);
  return await groupModel.findOne({ _id: id });
};
