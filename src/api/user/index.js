import { client } from "../client";

export const searchUsers = async (filters = {}) => {
  const response = await client.get("/user", { params: filters });
  return response.data;
};

export const getUserById = async (id) => {
  const response = await client.get(`/user/${id}`);
  return response.data;
};
