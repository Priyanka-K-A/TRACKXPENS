import axios from "axios";

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000/api";

// Create axios instance with default config
const api = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json"
  }
});

// Add token to requests automatically
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Handle response errors globally
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      localStorage.removeItem("token");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  signup: (data) => api.post("/auth/signup", data),
  login: (data) => api.post("/auth/login", data),
  getProfile: () => api.get("/auth/me"),
  updateProfile: (data) => api.put("/auth/profile", data),
  changePassword: (data) => api.put("/auth/change-password", data)
};

// Items/Transactions API
export const itemsAPI = {
  getAll: (params) => api.get("/items", { params }),
  getById: (id) => api.get(`/items/${id}`),
  create: (data) => api.post("/items", data),
  update: (id, data) => api.put(`/items/${id}`, data),
  delete: (id) => api.delete(`/items/${id}`),
  deleteAll: () => api.delete("/items")
};

// Analytics API
export const analyticsAPI = {
  getSummary: (params) => api.get("/analytics/summary", { params }),
  getByCategory: (params) => api.get("/analytics/category", { params }),
  getMonthly: (params) => api.get("/analytics/monthly", { params }),
  getTrends: (params) => api.get("/analytics/trends", { params }),
  getTopExpenses: (params) => api.get("/analytics/top-expenses", { params })
};

// Budget API
export const budgetAPI = {
  getAll: () => api.get("/budget"),
  getCurrent: () => api.get("/budget/current"),
  create: (data) => api.post("/budget", data),
  update: (id, data) => api.put(`/budget/${id}`, data),
  delete: (id) => api.delete(`/budget/${id}`)
};

// Categories API
export const categoriesAPI = {
  getAll: (params) => api.get("/categories", { params }),
  getById: (id) => api.get(`/categories/${id}`)
};

export default api;
