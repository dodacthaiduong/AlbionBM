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

module.exports = {
  SHOP_FILTER_FIELDS,
  parseShopFilters,
  buildShopFilterConditions,
};
