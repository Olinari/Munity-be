import qrcode from "qrcode-terminal";
import wwb from "whatsapp-web.js";
import { api } from "../api.js";
import toxicity from "@tensorflow-models/toxicity";
import fs from 'fs';
import ffmpeg from 'fluent-ffmpeg';
import axios from "axios";

const assembly = axios.create({
  baseURL: "https://api.assemblyai.com/v2",
  headers: {
    authorization: 'ae09e90a3bc4472892e4a3e12a582ef4',
    "content-type": "application/json",
  },
});

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
        return;
      }

      const media = await message.downloadMedia();
      const basePath = `message-${new Date().getMilliseconds()}`;
      const inputPath = `./public/${basePath}.${media.mimetype.split("/")[1].split(";")[0]}`;
      const outputPath = `./public/${basePath}.mp3`;
      fs.writeFile(
        inputPath,
        media.data,
        "base64",
        (err) => {
          if (err) { return console.error(err); }
          try {
            ffmpeg(inputPath)
              .output(outputPath)
              .on('end', () => {
                deleteFile(inputPath);
                transcribeSpeech(basePath);

              })
              .on('error', (err) => {
                console.error('Error during conversion: ', err);

              })
              .run();
          } catch (err) {
            console.error(err);
          }
        }
      );
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

async function transcribeSpeech(audioFilePath) {

  try {
    const apiKey = "fc201334-a771-4937-aa3c-01662e8f52dd";
    const config = {
      method: "POST",
      url: "https://api.oneai.com/api/v0/pipeline/async",
      headers: {
        "api-key": apiKey,
        "Content-Type": "application/json",
      },
      data: {
        input: `https://api.munity.info/public/${audioFilePath}.mp3`,
        input_type: "conversation",
        content_type: "audio/mpeg",
        multilingual: {
          enabled: true
        },
        steps: [
          {
            skill: "transcribe"
          }
        ],
      },
    };

    try {
      (async () => {
        const response = await axios(config);
        const polling = new Promise((resolve) => {
          const interval = setInterval(async () => {
            const pollingResponse = await axios.get(
              "https://api.oneai.com/api/v0/pipeline/async/tasks/" + response.data.task_id,
              { headers: config.headers }
            );
            if (pollingResponse.data.status !== "RUNNING") {
              resolve(pollingResponse.data.result);
              clearInterval(interval);
            }
          }, 3000);
        });
        const result = await polling;
        console.log(JSON.stringify(result));
      })();
    } catch (error) {
      console.log(error);
    }
  } catch (error) {
    console.log(error);
  }
}

function deleteFile(filePath) {
  fs.unlink(filePath, (err) => {
    if (err) {
      console.error(`Error deleting file ${filePath}: ${err}`);
    } else {
      console.log(`File ${filePath} deleted successfully`);
    }
  });
}