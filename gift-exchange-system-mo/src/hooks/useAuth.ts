import { useEffect, useState } from "react";
import { useAuthStore } from "@/src/stores/authStore";

export const useAuthCheck = () => {
  const [isLoading, setIsLoading] = useState(true);
  const { isAuthenticated, checkAuth, accessToken, userId, userRole } = useAuthStore();

  useEffect(() => {
    const init = async () => {
      try {
        setIsLoading(true);
        await checkAuth();
      } finally {
        setIsLoading(false);
      }
    };
    init();
  }, []);

  return {
    isAuthenticated,
    isLoading,
    userData: { accessToken, userId, userRole },
    checkAuthStatus: checkAuth,
  };
};