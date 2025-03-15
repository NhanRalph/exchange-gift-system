import { useState, useEffect } from "react";
import axiosInstance from "@/api/axiosInstance";
import { Category, SubCategory } from "@/shared/type";
import Constants from "expo-constants";
const API_CATEGORY = (Constants.expoConfig as any).extra.API_CATEGORY;

export const useCategories = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [subCategories, setSubCategories] = useState<SubCategory[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const getCategories = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await axiosInstance.get("category");
      setCategories(response.data.data);
    } catch (err) {
      setError("Failed to fetch categories");
      console.error("Error fetching categories:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const getSubCategories = async (categoryId: string) => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await axiosInstance.get(`${API_CATEGORY}/${categoryId}`);
      setSubCategories(response.data.data.subCategories);
    } catch (err) {
      setError("Failed to fetch sub-categories");
      console.error("Error fetching sub-categories:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    getCategories();
  }, []);

  const refreshCategories = () => {
    getCategories();
  };

  return {
    categories,
    subCategories,
    isLoading,
    error,
    refreshCategories,
    getSubCategories,
  };
};

export default useCategories;
