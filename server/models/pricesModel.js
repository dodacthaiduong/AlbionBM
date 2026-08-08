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
  const sellCity = "Black Market";

  const result = await pool.query(
    `SELECT buy.unique_name,
            buy.english_name,
            buy.enchant,
            buy.quality,
            buy.city AS buy_city,
            buy.buy_price,
            buy.buy_price_date,
            $${values.length + 1} AS sell_city,
            bm.sell_price_min AS sell_price,
            bm.sell_price_min_date AS sell_price_date
     FROM (
       SELECT DISTINCT ON (prices.unique_name, prices.enchant, prices.quality)
              prices.unique_name,
              prices.server,
              prices.enchant,
              prices.quality,
              prices.city,
              prices.sell_price_min AS buy_price,
              prices.sell_price_min_date AS buy_price_date,
              items.localized_names ->> 'EN-US' AS english_name
       FROM item_prices_current AS prices
       JOIN items ON items.unique_name = prices.unique_name
       WHERE ${whereClause}
       ORDER BY prices.unique_name, prices.enchant, prices.quality, prices.sell_price_min ASC, prices.city
     ) AS buy
     JOIN item_prices_current AS bm
       ON bm.server = buy.server
      AND bm.unique_name = buy.unique_name
      AND bm.enchant = buy.enchant
      AND bm.quality = 1
      AND bm.city = $${values.length + 1}
     WHERE bm.sell_price_min IS NOT NULL
       AND bm.city IS DISTINCT FROM buy.city`,
    [...values, sellCity]
  );

  return result.rows.map((row) => ({
    unique_name: row.unique_name,
    english_name: row.english_name,
    enchant: row.enchant,
    quality: row.quality,
    buy: { city: row.buy_city, sell_price_min: row.buy_price, sell_price_min_date: row.buy_price_date },
    sell: { city: row.sell_city, sell_price_min: row.sell_price, sell_price_min_date: row.sell_price_date },
  }));
};

module.exports = { getCurrentPrices, getFlipRows };
