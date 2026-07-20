import { client } from "../client";
import { tokenStorage } from "../../utils/storage";

export const login = async (email, password) => {
  const response = await client.post("/auth/login", { email, password });
  const data = response.data;

  const accessToken = data?.accessToken || data?.data?.accessToken;
  const refreshToken = data?.refreshToken || data?.data?.refreshToken;

  if (accessToken) {
    await tokenStorage.setTokens(accessToken, refreshToken);
  }

  return data;
};
