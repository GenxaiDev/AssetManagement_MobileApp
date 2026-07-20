import { client } from "../client";

export const resetPassword = async (token, newPassword) => {
  await client.post("/auth/reset-password", { token, newPassword });
};
