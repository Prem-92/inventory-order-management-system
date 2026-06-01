import axios from "axios";

export const apiClient = axios.create({
  baseURL: "http://localhost:8000/api/v1",
  headers: {
    "Content-Type": "application/json"
  }
});

// ================= PRODUCTS =================
export const productService = {
  list: async () => (await apiClient.get("/products/")).data,
  create: async (data) => (await apiClient.post("/products/", data)).data,
  update: async (id, data) => (await apiClient.put(`/products/${id}`, data)).data,
  delete: async (id) => (await apiClient.delete(`/products/${id}`)).data
};

// ================= CUSTOMERS =================
export const customerService = {
  list: async () => (await apiClient.get("/customers/")).data,
  create: async (data) => (await apiClient.post("/customers/", data)).data,
  delete: async (id) => (await apiClient.delete(`/customers/${id}`)).data
};

// ================= ORDERS =================
export const orderService = {
  list: async () => (await apiClient.get("/orders/")).data,
  create: async (data) => (await apiClient.post("/orders/", data)).data,
  delete: async (id) => (await apiClient.delete(`/orders/${id}`)).data
};