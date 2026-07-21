import { client } from "../client";

export const changePassword = async (currentPassword, newPassword, confirmPassword) => {
  await client.post("/auth/change-password", { currentPassword, newPassword, confirmPassword });
};