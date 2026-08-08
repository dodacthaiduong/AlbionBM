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

const getFlipRows = async ({ server, filters = {}, tier = null, enchant = null, quality = null }) => {
  const { conditions: filterConditions, values: filterValues } =
    buildShopFilterConditions(filters, { startIndex: 2 });
  const values = [server, ...filterValues];
  const conditions = ["prices.server = $1", "prices.sell_price_min IS NOT NULL", ...filterConditions];

  if (tier !== null) {
    values.push(tier);
    conditions.push(`items.tier = $${values.length}`);
  }

  if (enchant !== null) {
    values.push(enchant);
    conditions.push(`prices.enchant = $${values.length}`);
  }

  if (quality !== null) {
    values.push(quality);
    conditions.push(`prices.quality = $${values.length}`);
  }

  const whereClause = conditions.join(" AND ");

  const result = await pool.query(
    `SELECT sub.unique_name,
            sub.english_name,
            sub.enchant,
            sub.quality,
            sub.buy_city,
            sub.buy_price,
            sub.sell_city,
            sub.sell_price
     FROM (
       SELECT prices.unique_name,
              items.localized_names ->> 'EN-US' AS english_name,
              prices.enchant,
              prices.quality,
              FIRST_VALUE(prices.city) OVER w_min  AS buy_city,
              FIRST_VALUE(prices.sell_price_min) OVER w_min AS buy_price,
              FIRST_VALUE(prices.city) OVER w_max  AS sell_city,
              FIRST_VALUE(prices.sell_price_min) OVER w_max AS sell_price
       FROM item_prices_current AS prices
       JOIN items ON items.unique_name = prices.unique_name
       WHERE ${whereClause}
       WINDOW w_min AS (
         PARTITION BY prices.unique_name, prices.enchant, prices.quality
         ORDER BY prices.sell_price_min ASC, prices.city
       ),
       w_max AS (
         PARTITION BY prices.unique_name, prices.enchant, prices.quality
         ORDER BY prices.sell_price_min DESC, prices.city
       )
     ) AS sub
     WHERE sub.buy_city IS DISTINCT FROM sub.sell_city`,
    values
  );

  return result.rows.map((row) => ({
    unique_name: row.unique_name,
    english_name: row.english_name,
    enchant: row.enchant,
    quality: row.quality,
    buy: { city: row.buy_city, sell_price_min: row.buy_price },
    sell: { city: row.sell_city, sell_price_min: row.sell_price },
  }));
};

module.exports = { getCurrentPrices, getFlipRows };
