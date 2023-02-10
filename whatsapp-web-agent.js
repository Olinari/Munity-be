import qrcode from "qrcode-terminal";
import wwb from "whatsapp-web.js";
import { assignActions } from "./whatsapp-web-actions.js";

const TIME_OUT = 60000;
const { Client } = wwb;

export function connectAgent() {
  const state = { haltNewQrs: false };
  const client = new Client();
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
  };
}
