import { client } from "../client";

export const refreshToken = async (refreshToken) => {
  const response = await client.post("/auth/refresh-token", { refreshToken });
  return response.data;
};
