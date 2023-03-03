import { updateGroupWithMessage } from "../controllers/group-controller.js";
import { updateDayWithMessage } from "../controllers/time-controller.js";

const actions = {
  message: async (message) => {
    try {
      const groupName = await updateGroupWithMessage(message);
      groupName && updateDayWithMessage({ message, groupName });
    } catch (error) {
      console.log(error);
    }
  },
  /*   disconnected: () => api.post("disconnect"), */
};

export const assignActions = (client) => {
  Object.keys(actions).forEach((event) => {
    client.on(event, (args) => actions[event]?.(args));
  });
  return client;
};
