import { client } from "../client";

export const getServiceRequests = async (filters = {}) => {
  const response = await client.get("/service-requests", { params: filters });
  return response.data;
};

export const getServiceRequestById = async (id) => {
  const response = await client.get(`/service-requests/${id}`);
  return response.data;
};

export const createServiceRequest = async (data) => {
  const response = await client.post("/service-requests", data);
  return response.data;
};

export const updateServiceRequest = async (id, data) => {
  const response = await client.patch(`/service-requests/${id}`, data);
  return response.data;
};

export const deleteServiceRequest = async (id) => {
  await client.delete(`/service-requests/${id}`);
};
