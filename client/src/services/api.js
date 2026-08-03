import axios from "axios";

const api = axios.create({
  baseURL: "/api",
});

export const getAllItems = async (page = 1, limit = 50, filters = {}) => {
  const res = await api.get("/items", {
    params: { page, limit, ...filters },
  });
  return res.data;
};

export const getShopFilterOptions = async () => {
  const res = await api.get("/items/filter-options");
  return res.data;
};

export const getItemByUniqueName = async (uniqueName) => {
  const res = await api.get(`/items/${encodeURIComponent(uniqueName)}`);
  return res.data;
};

export const getCurrentPrices = async (page = 1, limit = 50, server = "asia", filters = {}) => {
  const res = await api.get("/prices/current", {
    params: { page, limit, server, ...filters },
  });
  return res.data;
};

export const startPriceUpdate = async (server = "asia") => {
  const res = await api.post("/prices/update-all", { server });
  return res.data;
};

export const getPriceUpdateStatus = async (jobId) => {
  const res = await api.get(`/prices/update-all/${encodeURIComponent(jobId)}`);
  return res.data;
};

export const getLatestPriceUpdate = async (server = "asia") => {
  const res = await api.get("/prices/update-all", { params: { server } });
  return res.data;
};