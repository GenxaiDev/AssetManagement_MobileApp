import { client } from "../client.js";

export const getAll = async (filters = {}) => {
  const response = await client.get("/client", { params: filters });
  return response.data;
};
