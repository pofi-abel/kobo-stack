import axios from "axios";
import { nibssTokenService } from "./nibssTokenService";
import { env } from "../../config/env";

const nibssClient = axios.create({
  baseURL: env.NIBSS_BASE_URL,
  timeout: 30000,
  headers: { "Content-Type": "application/json" },
});

// Inject the NIBSS Bearer token on every request
nibssClient.interceptors.request.use(async (config) => {
  const token = await nibssTokenService.getToken();
  config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export default nibssClient;
