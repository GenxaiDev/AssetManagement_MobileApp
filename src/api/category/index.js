import { client } from "../client";

export const getCategories = async (requestType) => {
  const response = await client.get("/requests/categories", { params: { requestType } });
  return response.data;
};

export const getAllCategories = async () => {
  const response = await client.get("/categories");
  return response.data;
};
