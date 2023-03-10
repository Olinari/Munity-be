import { groupModel } from "../models/group-model.js";
import { api } from "../api.js";

export const getGroups = async () => await groupModel.find();

export const getGroupById = async (id) => {
  console.log(id);
  return await groupModel.findOne({ _id: id });
};

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

      try {
        const filter = { name: groupId };
        const currentGroup = await groupModel.findOne(filter);
        const syncdPatricipants = await Promise.all(
          participants
            ? participants.map(
              async ({ id, isAdmin, isSuperAdmin }, index) => ({
                phone: id.user,
                isAdmin,
                isSuperAdmin,
                messages: currentGroup
                  ? currentGroup.participants?.[index]?.messages
                  : 0,
                profilePicUrl:
                  //Temp solution to prevent errors for whatsapp-web.js
                  currentGroup.profilePicUrl ??
                  (await client?.getProfilePicUrl(id._serialized)),
              })
            )
            : []
        );

        const topContributorIndex = currentGroup
          ? currentGroup.participants.reduce(
            (maxIndex, participant, currentIndex) => {
              return participant.messages >
                currentGroup.participants[maxIndex].messages
                ? currentIndex
                : maxIndex;
            },
            0
          )
          : 0;

        await groupModel.updateOne(
          filter,
          {
            $set: {
              name: groupId,
              createdAt,
              subject,
              ownerPhone,
              ownerSerialized,
              adminProfilePic: await client?.getProfilePicUrl(ownerSerialized),
              participants: syncdPatricipants,
              topContributorIndex,
            },
          },
          { upsert: true }
        );
      } catch (error) {
        console.error(error);
      }
    }
  });
};

export const updateGroupWithMessage = async (message) => {
  console.log(message);
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
    await groupModel.updateOne(
      { name },
      {
        $inc: {
          "participants.$[participant].messages": 1,
          [`messagesDistribution.${now}`]: 1,
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
