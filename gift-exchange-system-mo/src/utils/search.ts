export type SearchMode = "default" | "need" | "have";

export const searchModes = [
  {
    value: "default",
    label: "Tìm kiếm theo tên",
    icon: "search",
    description: "Tìm kiếm theo tên sản phẩm",
  },
  {
    value: "need",
    label: "Tìm theo danh mục",
    icon: "category",
    description: "Tìm kiếm theo danh mục cần",
  },
  {
    value: "have",
    label: "Tìm người cần đồ",
    icon: "people",
    description: "Tìm người cần đồ của bạn",
  },
] as const;

export const getSearchValue = (searchTerm: string, searchMode: SearchMode) => {
  return `${searchMode}_${searchTerm}`;
};
