import qrcode from "qrcode-terminal";
import wwb from "whatsapp-web.js";
import { assignActions } from "./whatsapp-web-actions.js";

const TIME_OUT = 60000;
const { Client, LocalAuth } = wwb;

export function connectWhatsappAgent() {
  const state = { haltNewQrs: false };
  const client = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: {
      headless: true,
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-extensions",
      ],
    },
  });
  client.initialize();

  return {
    getAuthData: () =>
      new Promise((resolve) => {
        const clearId = setTimeout(() => {
          resolve(false);
        }, TIME_OUT);

        client.once("qr", (qr) => {
          if (!state.isAuthenticated) {
            qrcode.generate(qr, { small: true }, (qr) => {
              clearTimeout(clearId);
              resolve({ qr });
            });
          }
        });
      }),

    createClient: () =>
      new Promise((resolve) => {
        if (!state.haltNewQrs) {
          state.haltNewQrs = true;
          const clearId = setTimeout(() => {
            resolve({ isConnected: false, client: null });
          }, TIME_OUT);

          client.once("ready", () => {
            state.haltNewQrs = false;
            clearTimeout(clearId);
            resolve({ isConnected: true, client: assignActions(client) });
          });
        }
      }),

    restoreSession: () =>
      new Promise((resolve) => {
        const clearId = setTimeout(() => {
          console.log("Could'nt restore exisitng Session");
          resolve({ isConnected: false, client: null });
        }, 15000);

        client.once("ready", () => {
          console.log("Client ready");
          state.haltNewQrs = false;
          clearTimeout(clearId);
          resolve({ isConnected: true, client: assignActions(client) });
        });
      }),
  };
}
