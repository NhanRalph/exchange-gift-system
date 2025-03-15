import { create } from "zustand";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { User } from "@/src/shared/type";

interface AuthState {
  isAuthenticated: boolean;
  accessToken: string | null;
  email: string | null;
  userId: string | null;
  userRole: string | null;
  userData: User | null;
  fullname: string | null;
  setAuth: (data: {
    accessToken: string | null;
    userId: string | null;
    userRole: string | null;
  }) => void;
  setUserData: (data: User | null) => void;
  login: (data: {
    accessToken: string;
    refreshToken: string;
    email: string;
    userId: string;
    userRole: string;
    user: User;
    fullname: string;
  }) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  isAuthenticated: false,
  accessToken: null,
  email: null,
  userId: null,
  userRole: null,
  userData: null,
  fullname: null,

  setAuth: (data) =>
    set({
      isAuthenticated: !!data.accessToken && !!data.userId,
      accessToken: data.accessToken,
      userId: data.userId,
      userRole: data.userRole,
    }),

  setUserData: (data) => set({ userData: data }),

  login: async (data) => {
    try {
      await AsyncStorage.multiSet([
        ["accessToken", data.accessToken],
        ["refreshToken", data.refreshToken],
        ["email", data.email],
        ["userId", data.userId],
        ["userRole", data.userRole],
        ["user", JSON.stringify(data.user)],
        ["fullname", data.fullname],
      ]);

      set({
        isAuthenticated: true,
        accessToken: data.accessToken,
        email: data.email,
        userId: data.userId,
        userRole: data.userRole,
        userData: data.user,
        fullname: data.fullname,
      });
    } catch (error) {
      console.error("Error storing auth data:", error);
      throw error;
    }
  },

  logout: async () => {
    await AsyncStorage.multiRemove([
      "accessToken",
      "refreshToken",
      "email",
      "userId",
      "userRole",
      "user",
      "fullname",
    ]);
    set({
      isAuthenticated: false,
      accessToken: null,
      email: null,
      userId: null,
      userRole: null,
      userData: null,
      fullname: null,
    });
  },

  checkAuth: async () => {
    const [accessToken, email, userId, userRole] = await Promise.all([
      AsyncStorage.getItem("accessToken"),
      AsyncStorage.getItem("email"),
      AsyncStorage.getItem("userId"),
      AsyncStorage.getItem("userRole"),
    ]);

    set({
      isAuthenticated: !!accessToken && !!userId,
      accessToken,
      email,
      userId,
      userRole,
    });
  },
}));
