const SHOP_FILTER_FIELDS = [
  "shop_category",
  "shop_subcategory1",
  "shop_subcategory2",
  "shop_subcategory3",
];

const parseShopFilters = (source = {}) =>
  Object.fromEntries(
    SHOP_FILTER_FIELDS.map((field) => [
      field,
      typeof source[field] === "string" ? source[field].trim() : "",
    ])
  );

const buildShopFilterConditions = (
  filters = {},
  { tableAlias = "items", startIndex = 1 } = {}
) => {
  const values = [];
  const conditions = [];

  SHOP_FILTER_FIELDS.forEach((field) => {
    const value = typeof filters[field] === "string" ? filters[field].trim() : "";

    if (value) {
      values.push(value);
      conditions.push(`${tableAlias}.${field} = $${startIndex + values.length - 1}`);
    }
  });

  return { conditions, values };
};

const parseMultiValue = (value) => {
  if (typeof value !== "string") return [];
  return value
    .split(",")
    .map((part) => part.trim())
    .filter((part) => part !== "");
};

const buildMultiValueConditions = (
  filters = {},
  { tableAlias = "items", startIndex = 1 } = {}
) => {
  const values = [];
  const conditions = [];
  const keys = [...SHOP_FILTER_FIELDS, "tier", "enchant", "quality"];

  for (const key of keys) {
    const parts = parseMultiValue(filters[key]);
    if (parts.length === 0) continue;
    const placeholders = parts
      .map((_, index) => `$${startIndex + values.length + index}`)
      .join(",");
    values.push(...parts);
    conditions.push(`${tableAlias}.${key}::text IN (${placeholders})`);
  }

  return { conditions, values };
};

module.exports = {
  SHOP_FILTER_FIELDS,
  parseShopFilters,
  buildShopFilterConditions,
  parseMultiValue,
  buildMultiValueConditions,
};
