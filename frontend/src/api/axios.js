import axios from "axios";

const api = axios.create({
  baseURL: "http://127.0.0.1:8000/api",
});

// =====================================================
// ADD ACCESS TOKEN TO EVERY REQUEST
// =====================================================

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("access_token");

    if (token) {
      config.headers = config.headers || {};
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// =====================================================
// AUTOMATICALLY REFRESH EXPIRED ACCESS TOKEN
// =====================================================

api.interceptors.response.use(
  (response) => {
    return response;
  },

  async (error) => {
    const originalRequest = error.config;

    // If there is no request configuration,
    // just return the error.
    if (!originalRequest) {
      return Promise.reject(error);
    }

    // Only handle 401 once per request.
    if (
      error.response?.status === 401 &&
      !originalRequest._retry
    ) {
      originalRequest._retry = true;

      const refreshToken =
        localStorage.getItem("refresh_token");

      // No refresh token → logout
      if (!refreshToken) {
        localStorage.removeItem("access_token");
        localStorage.removeItem("refresh_token");

        window.location.href = "/login";

        return Promise.reject(error);
      }

      try {
        const response = await axios.post(
          "http://127.0.0.1:8000/api/accounts/refresh/",
          {
            refresh: refreshToken,
          }
        );

        const newAccessToken =
          response.data.access;

        if (!newAccessToken) {
          throw new Error(
            "No access token returned from refresh endpoint."
          );
        }

        // Save new access token
        localStorage.setItem(
          "access_token",
          newAccessToken
        );

        // Add new token to original request
        originalRequest.headers =
          originalRequest.headers || {};

        originalRequest.headers.Authorization =
          `Bearer ${newAccessToken}`;

        // Retry original request
        return api(originalRequest);

      } catch (refreshError) {
        console.error(
          "Token refresh failed:",
          refreshError.response?.data ||
            refreshError.message
        );

        // Refresh token is no longer valid
        localStorage.removeItem("access_token");
        localStorage.removeItem("refresh_token");

        window.location.href = "/login";

        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default api;