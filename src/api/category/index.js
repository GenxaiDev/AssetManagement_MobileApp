import { client } from "../client";

export const getCategories = async (requestType) => {
  const response = await client.get("/requests/categories", { params: { requestType } });
  return response.data;
};
