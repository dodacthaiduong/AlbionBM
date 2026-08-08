const pool = require("../config/db");
const { buildShopFilterConditions } = require("../utils/shopFilters");

const getCurrentPrices = async ({
  server,
  page = 1,
  limit = 50,
  filters = {},
  enchant = null,
  tier = null,
  city = null,
  quality = null,
}) => {
  const offset = (page - 1) * limit;
  const { conditions: filterConditions, values: filterValues } =
    buildShopFilterConditions(filters, { startIndex: 2 });
  const values = [server, ...filterValues];
  const conditions = ["prices.server = $1", ...filterConditions];

  if (enchant !== null) {
    values.push(enchant);
    conditions.push(`prices.enchant = $${values.length}`);
  }

  if (tier !== null) {
    values.push(tier);
    conditions.push(`items.tier = $${values.length}`);
  }

  if (city !== null) {
    values.push(city);
    conditions.push(`prices.city = $${values.length}`);
  }

  if (quality !== null) {
    values.push(quality);
    conditions.push(`prices.quality = $${values.length}`);
  }

  const whereClause = conditions.join(" AND ");
  const limitParameter = values.length + 1;
  const offsetParameter = values.length + 2;

  const [pricesResult, countResult] = await Promise.all([
    pool.query(
      `SELECT prices.server,
              prices.unique_name,
              items.localized_names ->> 'EN-US' AS english_name,
              prices.enchant,
              prices.city,
              prices.quality,
              prices.sell_price_min,
              prices.sell_price_min_date,
              prices.sell_price_max,
              prices.sell_price_max_date,
              prices.buy_price_min,
              prices.buy_price_min_date,
              prices.buy_price_max,
              prices.buy_price_max_date,
              prices.fetched_at
       FROM item_prices_current AS prices
       JOIN items ON items.unique_name = prices.unique_name
       WHERE ${whereClause}
       ORDER BY prices.unique_name, prices.enchant, prices.city, prices.quality
       LIMIT $${limitParameter} OFFSET $${offsetParameter}`,
      [...values, limit, offset]
    ),
    pool.query(
      `SELECT COUNT(*)
       FROM item_prices_current AS prices
       JOIN items ON items.unique_name = prices.unique_name
       WHERE ${whereClause}`,
      values
    ),
  ]);

  const total = Number(countResult.rows[0].count);

  return {
    prices: pricesResult.rows,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
};

module.exports = { getCurrentPrices };
