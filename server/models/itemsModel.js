const pool = require("../config/db");
const { buildShopFilterConditions } = require("../utils/shopFilters");

const getAllItems = async (page = 1, limit = 50, filters = {}) => {
  const offset = (page - 1) * limit;
  const { conditions, values: filterValues } = buildShopFilterConditions(filters);

  const whereClause = conditions.length > 0
    ? `WHERE ${conditions.join(" AND ")}`
    : "";
  const limitParameter = filterValues.length + 1;
  const offsetParameter = filterValues.length + 2;

  const [itemsResult, countResult] = await Promise.all([
    pool.query(
      `SELECT unique_name, localized_names ->> 'EN-US' AS english_name,
              item_type, tier, weight, shop_category,
              shop_subcategory1, shop_subcategory2, shop_subcategory3,
              item_power, attributes, created_at
       FROM items
       ${whereClause}
       ORDER BY unique_name
       LIMIT $${limitParameter} OFFSET $${offsetParameter}`,
      [...filterValues, limit, offset]
    ),
    pool.query(
      `SELECT COUNT(*) FROM items ${whereClause}`,
      filterValues
    ),
  ]);

  const total = Number(countResult.rows[0].count);

  return {
    items: itemsResult.rows,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
};

const getShopFilterOptions = async () => {
  const result = await pool.query(
    `SELECT DISTINCT shop_category, shop_subcategory1,
                     shop_subcategory2, shop_subcategory3
     FROM items
     WHERE shop_category IS NOT NULL
     ORDER BY shop_category, shop_subcategory1,
              shop_subcategory2, shop_subcategory3`
  );

  return result.rows;
};

const getItemByUniqueName = async (uniqueName) => {
  const result = await pool.query(
    `SELECT unique_name, localized_names ->> 'EN-US' AS english_name,
            item_type, tier, weight, shop_category,
            shop_subcategory1, shop_subcategory2, shop_subcategory3,
            item_power, attributes, created_at
     FROM items
     WHERE unique_name = $1`,
    [uniqueName]
  );
  return result.rows[0] || null;
};

module.exports = { getAllItems, getShopFilterOptions, getItemByUniqueName };