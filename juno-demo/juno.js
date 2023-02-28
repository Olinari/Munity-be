import qrcode from "qrcode-terminal";
import wwb from "whatsapp-web.js";
import { api } from "../api.js";
import toxicity from "@tensorflow-models/toxicity";
import axios from "axios";
import fs from "fs";

const { Client } = wwb;

export function generateJunoClient({ phone, admin }) {
  const state = { haltNewQrs: false };

  const client = new Client({
    puppeteer: {
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    },
  });

  client.initialize((ex) => {
    console.log(ex);
  });

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
          qrcode.generate(qr, { small: true }, (qr) => {
            clearTimeout(clearId);
            console.log(qr);
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

            setTimeout(async () => {
              await client.destroy();
              await api.post(`juno/disconnect-client?phone=${phone}`);
            }, 300000);
          });
        }
      }),
  };
}

const assignJunoActions = (client, juno, parentPhone) => {
  const actions = {
    message: async (message) => {
      try {
        const { offensiveMessage, labels } = await measureToxicity(
          message.body
        );
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
      } catch (error) {
        console.log(error);
      }
    },
    message_create: async (message) => {
      if (!message.hasMedia) {
        try {
          const { offensiveMessage, labels } = await measureToxicity(
            message.body
          );
          if (offensiveMessage) {
            juno.sendMessage(
              `${parentPhone}@c.us`,
              `Ariel's phone sent messages you should know about.`
            );
            labels.forEach((label) => {
              juno.sendMessage(
                `${parentPhone}@c.us`,
                `Message contains ${label}`
              );
            });
          }
        } catch (error) {
          console.log(error);
        }
      }

      const media = await message.downloadMedia();
      console.log(media.mimetype);
      /*  fs.writeFile(
        `./myfile${Math.random(400) * 10}.${media.mimetype.split("/")[1]}`,
        media.data,
        "base64",
        () => {
          console.log("success");
        }
      ); */
      transcribeSpeech(media);
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

async function transcribeSpeech(audioFile) {
  const BASE_URL = "https://speech.googleapis.com/v1/speech:recognize";

  // Set up the request body
  const requestBody = {
    config: {
      encoding: "OGG_OPUS",
      sampleRateHertz: 16000,
      languageCode: "en-US",
    },
    audio: {
      content: audioFile,
    },
  };

  // Set up the request parameters
  const params = {
    key: process.env.GOOGLE_API_KEY,
  };

  try {
    const response = await axios.post(BASE_URL, requestBody, { params });
    const transcript = response.data.results[0].alternatives[0].transcript;
    console.log(`Transcription: ${transcript}`);
  } catch (error) {
    console.error(error);
  }
}
