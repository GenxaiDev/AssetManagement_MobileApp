import client from "../client.js";

// ─── Categories (Service/Incident) ──────────────────────────────────────────
export const getCategories = (requestType) =>
  client.get("/requests/categories", { params: { requestType } });

// ─── Locations ───────────────────────────────────────────────────────────────
export const getAllLocations = (params) =>
  client.get("/location", { params });

// ─── Clients ──────────────────────────────────────────────────────────────────
export const getAllClients = (params) =>
  client.get("/client", { params });

// ─── Users (searchable, used for "Raised By" / "Assigned To") ───────────────
export const searchUsers = (params) =>
  client.get("/user", { params: { employmentStatus: "Active", ...params } });

// ─── Active Allocations (used to auto-fill client/location/asset) ──────────
export const getAllAllocations = (params) =>
  client.get("/Allocation", { params });

// ─── OEM list (Service Provider Type = OEM) ─────────────────────────────────
export const getAllOems = (params) => client.get("/oem", { params });

// ─── Vendor list (Service Provider Type = Vendor) ───────────────────────────
export const getAllVendors = (params) => client.get("/vendor", { params });

// ─── Create/Update a Service or Incident request ────────────────────────────
export const saveRequest = (data) => client.post("/requests/save", data);

export const createServiceRequest = (data) =>
  saveRequest({ ...data, requestType: "Service" });

export const createIncidentRequest = (data) =>
  saveRequest({ ...data, requestType: "Incident" });