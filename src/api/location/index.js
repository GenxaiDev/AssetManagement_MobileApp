import { client } from "../client";

export const getAll = async (filters = {}) => {
  const response = await client.get("/location", { params: filters });
  return response.data;
};
