// src/services/api.js
// Instancia de axios configurada para llamar al backend
// El interceptor agrega el token JWT automáticamente en cada petición
import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
});

// Interceptor: antes de cada petición agrega el token si existe
api.interceptors.request.use((config) => {
  const token = sessionStorage.getItem("pisst_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
