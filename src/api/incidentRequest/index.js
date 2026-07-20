import { client } from "../client";

export const getIncidents = async (filters = {}) => {
  const response = await client.get("/incidents", { params: filters });
  return response.data;
};

export const getIncidentById = async (id) => {
  const response = await client.get(`/incidents/${id}`);
  return response.data;
};

export const createIncident = async (data) => {
  const response = await client.post("/incidents", data);
  return response.data;
};

export const updateIncident = async (id, data) => {
  const response = await client.patch(`/incidents/${id}`, data);
  return response.data;
};

export const deleteIncident = async (id) => {
  await client.delete(`/incidents/${id}`);
};
