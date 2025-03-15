import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Constants from "expo-constants";
const API_URL = (Constants.expoConfig as any).extra.API_URL;
console.log(API_URL);

const BASE_URL = API_URL;

// const BASE_URL = (() => {
//   if (!API_URL) {
//     console.warn("API_URL is undefined in .env");
//     return "http://103.142.139.142:6900/api/";
//   }

//   try {
//     const url = new URL(API_URL);
//     return url.toString();
//   } catch (error) {
//     console.warn("Invalid API_URL format in .env:", error);
//     return "http://103.142.139.142:6900/api/";
//   }
// })();

const axiosInstance = axios.create({
  baseURL: BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

export const clearAuthTokens = async () => {
  await AsyncStorage.multiRemove(["accessToken", "refreshToken", "userId"]);
};

// Add a request interceptor to include the access token in the headers
axiosInstance.interceptors.request.use(
  async (config) => {
    const accessToken = await AsyncStorage.getItem("accessToken");
    if (accessToken) {
      config.headers["Authorization"] = `Bearer ${accessToken}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add a response interceptor to handle token expiration and refresh token logic
axiosInstance.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    // Check if the error is related to an expired token
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        // Get the refresh token from storage
        const refreshToken = await AsyncStorage.getItem("refreshToken");

        if (!refreshToken) {
          // If no refresh token, clear everything and reject
          await clearAuthTokens();
          return Promise.reject(error);
        }

        const response = await axios.post(
          `${axiosInstance.defaults.baseURL}auth/refresh-token`,
          { token: refreshToken }
        );

        if (response.status === 200) {
          const { accessToken: newAccessToken, refreshToken: newRefreshToken } =
            response.data;

          // Store the new tokens in AsyncStorage
          await AsyncStorage.setItem("accessToken", newAccessToken);
          await AsyncStorage.setItem("refreshToken", newRefreshToken);

          // Update the authorization header with the new access token
          originalRequest.headers["Authorization"] = `Bearer ${newAccessToken}`;

          // Retry the original request with the new token
          return axiosInstance(originalRequest);
        }
      } catch (refreshError) {
        console.error("Token refresh failed:", refreshError);
        // Handle token refresh failure (e.g., redirect to login page)

        await clearAuthTokens();
      }
    }

    return Promise.reject(error);
  }
);

export default axiosInstance;
