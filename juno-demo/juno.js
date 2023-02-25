import qrcode from "qrcode-terminal";
import wwb from "whatsapp-web.js";
import { api } from "../api.js";
import toxicity from "@tensorflow-models/toxicity";

const { Client } = wwb;

export function generateJunoClient({ phone, admin }) {
  const state = { haltNewQrs: false };

  const client = new Client({
    puppeteer: {
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    },
  });

  client.initialize();

  return {
    getQr: () =>
      new Promise((resolve) => {
        const clearId = setTimeout(() => {
          resolve(false);
        }, 60000);

        client.once("authenticated", () => {
          console.log("already authenticated");
          resolve(false);
        });

        client.once("qr", (qr) => {
          if (state.isAuthenticated) {
            resolve(false);
          }
          qrcode.generate(qr, { small: true }, (qr) => {
            clearTimeout(clearId);
            resolve(qr);
          });
        });
      }),
    createClient: () =>
      new Promise((resolve) => {
        if (!state.haltNewQrs) {
          state.haltNewQrs = true;
          const clearId = setTimeout(() => {
            resolve({ isConnected: false, client: null });
          }, 60000);

          client.once("ready", () => {
            console.log("ready");
            state.haltNewQrs = false;
            clearTimeout(clearId);
            resolve({
              isConnected: true,
              client: assignJunoActions(client, admin, phone),
            });
          });
        }
      }),
  };
}

const assignJunoActions = (client, juno, parentPhone) => {
  const actions = {
    message: async (message) => {
      const { offensiveMessage, labels } = await measureToxicity(message.body);
      if (offensiveMessage) {
        juno.sendMessage(
          `${parentPhone}@c.us`,
          `Ariel's phone recieved messages you should know about.`
        );
        juno.sendMessage(`${parentPhone}@c.us`, `Message: ${message}`);
        labels.forEach((label) => {
          juno.sendMessage(`${phone}@c.us`, `Message contains ${label}`);
        });
      }
    },
    message_create: async (message) => {
      const { offensiveMessage, labels } = await measureToxicity(message.body);
      if (offensiveMessage) {
        juno.sendMessage(
          `${parentPhone}@c.us`,
          `Ariel's phone sent messages you should know about.`
        );
        labels.forEach((label) => {
          juno.sendMessage(`${parentPhone}@c.us`, `Message contains ${label}`);
        });
      }

      /* if (message.hasMedia) {
        const media = await message.downloadMedia();
        console.log(media.mimetype);
        fs.writeFile(
          `./myfile${Math.random(400) * 10}.${media.mimetype.split("/")[1]}`,
          media.data,
          "base64",
          () => {
            console.log("success");
          }
        );
      } */
    },
    disconnected: () => {
      const { message, isConnected } = api.post(
        `/juno/disconnect-client?phone=${parentPhone}`
      );

      if (message === "ok" && isConnected === false) {
        console.log("message");
      }
    },
  };

  Object.keys(actions).forEach((event) => {
    client.on(event, (args) => actions[event]?.(args));
  });
  return client;
};

const measureToxicity = async (sentence) => {
  try {
    const status = { offensiveMessage: false, labels: [] };
    const threshold = 0.3;

    const model = await toxicity.load(threshold);
    const predictions = await model.classify(sentence);

    predictions.forEach((prediction) => {
      if (prediction.results[0].match) {
        status.offensiveMessage = true;
        status.labels.push(prediction.label);
      }
    });

    return status;
  } catch (error) {
    console.log(error);
  }
};
