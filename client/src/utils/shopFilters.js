export const SHOP_FILTER_FIELDS = [
  { key: "shop_category", label: "Shop Category" },
  { key: "shop_subcategory1", label: "Subcategory 1" },
  { key: "shop_subcategory2", label: "Subcategory 2" },
  { key: "shop_subcategory3", label: "Subcategory 3" },
];

export const EMPTY_SHOP_FILTERS = Object.fromEntries(
  SHOP_FILTER_FIELDS.map(({ key }) => [key, ""])
);

export const createEmptyShopFilters = () => ({ ...EMPTY_SHOP_FILTERS });

export const hasActiveShopFilters = (filters) =>
  Object.values(filters).some(Boolean);

export const getUniqueValues = (rows, key) =>
  [...new Set(rows.map((row) => row[key]).filter(Boolean))].sort((a, b) =>
    a.localeCompare(b)
  );

export const valueToArray = (value) => {
  if (!value) return [];
  return String(value)
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);
};

export const arrayToValue = (parts) => parts.join(",");
