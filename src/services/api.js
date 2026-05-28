import axios from "axios";

let isRefreshing = false;
let failedQueue = [];

function processQueue(error, token = null) {
  failedQueue.forEach(({ resolve, reject }) => {
    if (error) reject(error);
    else resolve(token);
  });
  failedQueue = [];
}

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
});

// Agrega el token JWT en cada petición
api.interceptors.request.use((config) => {
  const token = sessionStorage.getItem("pisst_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    const status = error.response?.status;
    const detalle = error.response?.data?.detail ?? "";

    // Contraseña temporal — redirigir al formulario de cambio obligatorio
    if (status === 403 && detalle === "debe_cambiar_password") {
      window.location.href = "/cambiar-password";
      return Promise.reject(error);
    }

    // Base de datos no disponible
    if (status === 503) {
      window.location.href = "/mantenimiento";
      return Promise.reject(error);
    }

    // 401 en rutas de auth — dejar pasar al caller sin reintentar
    const esRutaAuth = originalRequest?.url?.includes("/auth/");
    if (status === 401 && esRutaAuth) {
      return Promise.reject(error);
    }

    // 401 en rutas protegidas — intentar renovar el access token
    if (status === 401 && !esRutaAuth && !originalRequest._retry) {
      const refreshToken = sessionStorage.getItem("pisst_refresh_token");

      if (!refreshToken) {
        sessionStorage.removeItem("pisst_token");
        sessionStorage.removeItem("pisst_user");
        window.location.href = "/login?sesion=expirada";
        return Promise.reject(error);
      }

      // Si ya hay un refresco en curso, encolar la petición fallida
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then((token) => {
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return api(originalRequest);
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const res = await axios.post(
          `${import.meta.env.VITE_API_URL}/auth/refresh`,
          { refresh_token: refreshToken }
        );
        const newToken = res.data.access_token;
        sessionStorage.setItem("pisst_token", newToken);
        processQueue(null, newToken);
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        sessionStorage.removeItem("pisst_token");
        sessionStorage.removeItem("pisst_refresh_token");
        sessionStorage.removeItem("pisst_user");
        window.location.href = "/login?sesion=expirada";
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default api;
