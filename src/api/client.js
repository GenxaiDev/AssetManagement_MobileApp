import axios from "axios";
import { tokenStorage } from "../utils/storage";

const API_BASE_URL = "https://uatassetapi.genxai.com/api";
// const API_BASE_URL = "http://localhost:5010/api";


export const client = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30_000,
  headers: { "Content-Type": "application/json" },
});

let isRefreshing = false;
let pendingRequests = [];

const processPendingRequests = (error, token = null) => {
  pendingRequests.forEach(({ resolve, reject, config }) => {
    if (error) {
      reject(error);
    } else {
      config.headers.Authorization = `Bearer ${token}`;
      resolve(client(config));
    }
  });
  pendingRequests = [];
};

client.interceptors.request.use(
  async (config) => {
    const accessToken = await tokenStorage.getAccessToken();
    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }

    const payload =
      config.method === "get" || config.method === "delete"
        ? config.params
        : config.data;

    console.log(
      `[API Request] ${config.method?.toUpperCase()} ${config.baseURL}${config.url}`,
      payload || ""
    );

    return config;
  },
  (error) => Promise.reject(error)
);

client.interceptors.response.use(
  (response) => {
    console.log(
      `[API Response] ${response.config.method?.toUpperCase()} ${response.config.baseURL}${response.config.url}`,
      response.data
    );
    return response;
  },
  async (error) => {
    console.log("error", error);
    const originalRequest = error.config;

    if (
      error.response &&
      error.response.status === 401 &&
      !originalRequest._retry
    ) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          pendingRequests.push({ resolve, reject, config: originalRequest });
        })
          .then((response) => response)
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const storedRefreshToken = await tokenStorage.getRefreshToken();

        if (!storedRefreshToken) {
          throw new Error("No refresh token available");
        }

        const { refreshToken } = await import("./auth/refreshToken");
        const response = await refreshToken(storedRefreshToken);
        const newAccessToken = response?.data?.accessToken;
        const newRefreshToken = response?.data?.refreshToken;

        if (newAccessToken) {
          await tokenStorage.setTokens(newAccessToken, newRefreshToken || storedRefreshToken);
          processPendingRequests(null, newAccessToken);
          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
          return client(originalRequest);
        }

        throw new Error("No access token in refresh response");
      } catch (refreshError) {
        processPendingRequests(refreshError);
        await tokenStorage.clearTokens();
        return Promise.reject(
          new Error("Session expired. Please log in again.")
        );
      } finally {
        isRefreshing = false;
      }
    }

    const message =
      error.response?.data?.message ||
      error.message ||
      "Something went wrong";
    return Promise.reject(new Error(message));
  }
);

export { API_BASE_URL };
export default client;