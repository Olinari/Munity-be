import axios from "axios";

const host = process.env.HOST || "localhost";
const port = process.env.PORT || 5501;
const endpoint = `http://${host}:${port}`;
const apiClient = axios;

export const api = {
  get: (route) => apiClient.get(`${endpoint}/${route}`),
  post: (route) => apiClient.post(`${endpoint}/${route}`),
  update: (route) => apiClient.update(`${endpoint}/${route}`),
  delete: (route) => apiClient.delete(`${endpoint}/${route}`),
};
