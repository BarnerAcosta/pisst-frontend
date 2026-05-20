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

// Interceptor: si el backend responde 401 en rutas protegidas, limpiar sesión y redirigir
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const esRutaLogin = error.config?.url?.includes("/auth/login");
    if (error.response?.status === 401 && !esRutaLogin) {
      const detalle = error.response?.data?.detail || "";
      sessionStorage.removeItem("pisst_token");
      sessionStorage.removeItem("pisst_user");
      const motivo = detalle.toLowerCase().includes("dispositivo")
        ? "dispositivo"
        : "expirada";
      window.location.href = `/login?sesion=${motivo}`;
    }
    return Promise.reject(error);
  }
);

export default api;
