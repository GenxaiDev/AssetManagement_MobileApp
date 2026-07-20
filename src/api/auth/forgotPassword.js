import { client } from "../client";

export const forgotPassword = async (email) => {
  await client.post("/auth/forgot-password", { email });
};
