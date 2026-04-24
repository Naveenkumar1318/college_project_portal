import axios from "axios";

/* ================= BASE CONFIG ================= */
const BASE_URL =
  import.meta.env.VITE_API_URL || "https://student-collab-backend-q6cm.onrender.com/api";

if (!import.meta.env.VITE_API_URL) {
  console.warn("⚠️ VITE_API_URL not set. Falling back to production backend.");
}

/* ================= AUTH API ================= */
const api = axios.create({
  baseURL: BASE_URL,
  withCredentials: true,
});

/* ================= PUBLIC API ================= */
export const publicAPI = axios.create({
  baseURL: BASE_URL,
});

/* ================= REFRESH STATE ================= */
let isRefreshing = false;

let failedQueue: Array<{
  resolve: (token: string) => void;
  reject: (error: any) => void;
}> = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (token) {
      prom.resolve(token);
    } else {
      prom.reject(error);
    }
  });
  failedQueue = [];
};

/* ================= REQUEST INTERCEPTOR ================= */
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("access_token");

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

/* ================= RESPONSE INTERCEPTOR ================= */
api.interceptors.response.use(
  (response) => response,

  async (error) => {
    const originalRequest = error.config;

    if (!originalRequest) {
      return Promise.reject(error);
    }

    /* ===== HANDLE 401 ===== */
    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      !originalRequest.url.includes("/auth/refresh")
    ) {
      /* ===== NO TOKEN → SKIP REFRESH ===== */
      const token = localStorage.getItem("access_token");
      if (!token) {
        return Promise.reject(error);
      }

      /* ===== QUEUE REQUESTS ===== */
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({
            resolve: (newToken: string) => {
              originalRequest.headers.Authorization = `Bearer ${newToken}`;
              resolve(api(originalRequest));
            },
            reject,
          });
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        /* ===== REFRESH TOKEN ===== */
        const res = await api.post("/auth/refresh", {});
        const newToken = res.data.access_token;

        /* ===== SAVE TOKEN ===== */
        localStorage.setItem("access_token", newToken);

        api.defaults.headers.common[
          "Authorization"
        ] = `Bearer ${newToken}`;

        processQueue(null, newToken);

        return api(originalRequest);

      } catch (err) {
        processQueue(err, null);

        /* ===== FORCE LOGOUT ===== */
        localStorage.removeItem("access_token");

        // 🔥 FIXED ROUTE
        window.location.href = "/login/student";

        return Promise.reject(err);

      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default api;
