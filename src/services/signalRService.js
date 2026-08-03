import * as signalR from "@microsoft/signalr";
import { tokenStorage } from "../utils/storage";

let connection = null;
let connecting = false;
let started = false;
const listeners = new Map();

async function getToken() {
  try {
    const accessToken = await tokenStorage.getAccessToken()
    const checkExpiration = (token) => {
      if (!token) return false;
      const payload = JSON.parse(atob(token.split(".")[1]));
      const exp = payload.exp;
      const now = Math.floor(Date.now() / 1000);
      return exp > now;
    };

    if (checkExpiration(accessToken)) {
      return accessToken;
    }

    // If the access token is expired, try to refresh it
    const refreshToken = await tokenStorage.getRefreshToken();
    if (!refreshToken || !checkExpiration(refreshToken)) {
      return null; // No valid refresh token available
    }

    // Call your API to refresh the access token using the refresh token
    const response = await axios.post("https://uatassetapi.genxai.com/api/auth/refresh-token", {
      refreshToken: refreshToken,
    });
    
    const newAccessToken = response.data.accessToken;
    const newRefreshToken = response.data.refreshToken;

    // Clear the old tokens before storing the new ones
    await tokenStorage.clearTokens();

    // Store the new tokens
    await tokenStorage.setTokens(newAccessToken, newRefreshToken);
    return newAccessToken;
  } catch (error) {
    console.error("Error getting token:", error);
    return null;
  }
}

function registerListeners(conn) {
  for (const [callback, event] of listeners.entries()) {
    conn.on(event, callback);
  }
}

function getConnection() {
  if (!connection) {
    connection = new signalR.HubConnectionBuilder()
      .withUrl("https://uatassetapi.genxai.com/notificationHub", {
        accessTokenFactory: async () => (await getToken()) ?? "",
        skipNegotiation: true,
        transport: signalR.HttpTransportType.WebSockets,
      })
      .withAutomaticReconnect([0, 2000, 5000, 10000])
      .build();

    registerListeners(connection);

    connection.onreconnected(async () => {
      try {
        const stored = await tokenStorage.getAuthData();
        let parsed;
        if (typeof stored === "string") {
          parsed = JSON.parse(stored);
        } else {
          parsed = stored;
        }
        const userId = parsed?.user?.userId ?? parsed?.state?.user?.userId ?? null;
        if (userId) {
          await connection.invoke("JoinUserGroup", userId);
        }
      } catch {
        /* silently retry on next reconnect */
      }
    });
  }

  return connection;
}

async function getUserId() {
  try {
    const stored = await tokenStorage.getAuthData();
    if (!stored) return null;
    let parsed;
    if (typeof stored === "string") {
      parsed = JSON.parse(stored);
    } else {
      parsed = stored;
    }
    return parsed?.user?.userId ?? parsed?.state?.user?.userId ?? null;
  } catch {
    return null;
  }
}

export const signalRService = {
  async start() {
    if (started) return;
    if (connecting) return;
    connecting = true;

    try {
      const conn = getConnection();
      const token = await getToken();

      if (!token) {
        connecting = false;
        return;
      }

      if (conn.state === signalR.HubConnectionState.Disconnected) {
        try {
          await conn.start();
          const userId = await getUserId();
          if (userId) {
            conn.invoke("JoinUserGroup", userId).catch(() => {});
          }
          started = true;
        } catch (err) {
          console.warn("SignalR start error:", err.message || err);
          started = false;
        } finally {
          connecting = false;
        }
      } else {
        started = true;
        connecting = false;
      }
    } catch (err) {
      console.warn("SignalR initialization error:", err.message || err);
      connecting = false;
    }
  },

  stop() {
    if (connection) {
      connection.stop().catch(() => {});
      connection = null;
      started = false;
      connecting = false;
      listeners.clear();
    }
  },

  on(event, callback) {
    listeners.set(callback, event);
    if (connection) {
      connection.on(event, callback);
    }
  },

  off(event, callback) {
    if (connection) {
      connection.off(event, callback);
    }
    listeners.delete(callback);
  },

  get isStarted() {
    return started;
  },

  get state() {
    return connection?.state ?? null;
  },
};
