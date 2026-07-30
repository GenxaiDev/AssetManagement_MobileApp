import * as SecureStore from "expo-secure-store";

const ACCESS_TOKEN_KEY = "access_token";
const REFRESH_TOKEN_KEY = "refresh_token";
const AUTH_DATA_KEY = "auth_data";

export const tokenStorage = {
  async getAccessToken() {
    try {
      const token = await SecureStore.getItemAsync(ACCESS_TOKEN_KEY);
      return token;
    } catch (error) {
      console.error("Error getting access token:", error);
      return null;
    }
  },

  async getRefreshToken() {
    try {
      const token = await SecureStore.getItemAsync(REFRESH_TOKEN_KEY);
      return token;
    } catch (error) {
      console.error("Error getting refresh token:", error);
      return null;
    }
  },

  async getAuthData() {
    try {
      const authData = await SecureStore.getItemAsync(AUTH_DATA_KEY);
      if (!authData) return null;
      try {
        return JSON.parse(authData);
      } catch {
        return authData;
      }
    } catch (error) {
      console.error("Error getting auth data:", error);
      return null;
    }
  },

  async setAccessToken(token) {
    try {
      await SecureStore.setItemAsync(ACCESS_TOKEN_KEY, token);
    } catch (error) {
      console.error("Error setting access token:", error);
    }
  },

  async setRefreshToken(token) {
    try {
      await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, token);
    } catch (error) {
      console.error("Error setting refresh token:", error);
    }
  },

  async setTokens(accessToken, refreshToken) {
    try {
      if (accessToken) await SecureStore.setItemAsync(ACCESS_TOKEN_KEY, accessToken);
      if (refreshToken) await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, refreshToken);
    } catch (error) {
      console.error("Error setting tokens:", error);
    }
  },

  async setAuthData(authData) {
    try {
      await SecureStore.setItemAsync(AUTH_DATA_KEY, authData);
    } catch (error) {
      console.error("Error setting auth data:", error);
    }
  },

  async clearTokens() {
    try {
      await SecureStore.deleteItemAsync(ACCESS_TOKEN_KEY);
      await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY);
    } catch (error) {
      console.error("Error clearing tokens:", error);
    }
  },
};
