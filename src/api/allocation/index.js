import { client } from "../client";

export const getAll = async (filters = {}) => {
  const response = await client.get("/allocations", { params: filters });
  return response.data;
};
