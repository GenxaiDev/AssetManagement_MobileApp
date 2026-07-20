import { client } from "../client";

export const changePassword = async (currentPassword, newPassword) => {
  await client.post("/auth/change-password", { currentPassword, newPassword });
};
