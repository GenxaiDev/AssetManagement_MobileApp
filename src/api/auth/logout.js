import { client } from "../client";
import { tokenStorage } from "../../utils/storage";

export const logout = async () => {
  await tokenStorage.clearTokens();
  await client.post("/auth/logout");
};
