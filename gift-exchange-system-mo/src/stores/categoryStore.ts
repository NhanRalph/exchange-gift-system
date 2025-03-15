import { create } from "zustand";
import { Category, SubCategory } from "@/src/shared/type";

interface CategoryState {
  category: Category | null;
  subCategory: SubCategory | null;
  setCategory: (category: Category | null) => void;
  setSubCategory: (subCategory: SubCategory | null) => void;
  resetCategory: () => void;
}

export const useCategoryStore = create<CategoryState>((set) => ({
  category: null,
  subCategory: null,
  setCategory: (category) => set({ category }),
  setSubCategory: (subCategory) => set({ subCategory }),
  resetCategory: () => set({ category: null, subCategory: null }),
}));
