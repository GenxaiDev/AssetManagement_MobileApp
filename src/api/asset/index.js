import { client } from "../client";

export const getAssets = async (filters = {}) => {
  console.log("filters of asset", filters);
  const response = await client.get("/assets", { params: filters });
  console.log("response of asset", response.data);
  return response.data;
};

export const searchAsset = async (assetCode) => {
  const response = await client.get("/asset", { params: { searchText: assetCode } });
  const list = response.data?.data;
  return Array.isArray(list) ? (list[0] || null) : list || null;
};

export const getAssetById = async (id) => {
  const response = await client.get(`/assets/${id}`);
  return response.data;
};

export const createAsset = async (data) => {
  const response = await client.post("/assets", data);
  return response.data;
};

export const updateAsset = async (id, data) => {
  const response = await client.patch(`/assets/${id}`, data);
  return response.data;
};

export const deleteAsset = async (id) => {
  await client.delete(`/assets/${id}`);
};
