const pool = require("../config/db");
const { buildShopFilterConditions, buildMultiValueConditions } = require("../utils/shopFilters");

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

const buildFlipWhere = ({ server, filters = {}, tier = null, enchant = null, quality = null, buyCity = null }) => {
  const { conditions: itemConditions, values: itemValues } = buildMultiValueConditions(
    { ...filters, tier },
    { tableAlias: "items", startIndex: 2 }
  );
  const { conditions: priceConditions, values: priceValues } = buildMultiValueConditions(
    { enchant, quality },
    { tableAlias: "prices", startIndex: 2 + itemValues.length }
  );
  const values = [...itemValues, ...priceValues];
  const conditions = ["prices.server = $1", "prices.sell_price_min IS NOT NULL", ...itemConditions, ...priceConditions];
  if (buyCity) {
    values.push(buyCity);
    conditions.push(`prices.city = $${values.length + 1}`);
  }
  return { whereClause: conditions.join(" AND "), values };
};

const getFlipRows = async ({ server, filters = {}, tier = null, enchant = null, quality = null, buyCity = null }) => {
  const { whereClause, values: filterValues } = buildFlipWhere({ server, filters, tier, enchant, quality, buyCity });
  const values = [server, ...filterValues];
  const sellCity = "Black Market";

  const result = await pool.query(
    `SELECT buy.unique_name,
            buy.english_name,
            buy.enchant,
            buy.quality,
            buy.city AS buy_city,
            buy.buy_price,
            buy.buy_price_date,
            $${values.length + 1}::text AS sell_city,
            bm.sell_price_min AS sell_price,
            bm.sell_price_min_date AS sell_price_date,
            bm30.bm_avg_30d,
            bm30.bm_sold_30d
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
     LEFT JOIN item_bm_30d AS bm30
       ON bm30.server = buy.server
      AND bm30.unique_name = buy.unique_name
      AND bm30.enchant = buy.enchant
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
    bm_avg_30d: row.bm_avg_30d,
    bm_sold_30d: row.bm_sold_30d,
  }));
};

const getUpgradeFlipRows = async ({ server, filters = {}, tier = null, enchant = null, quality = null, buyCity = null }) => {
  let targetEnchants = [1, 2, 3];
  if (enchant !== null && enchant !== "") {
    targetEnchants = String(enchant)
      .split(",")
      .map((part) => Number(part.trim()))
      .filter((e) => e >= 1 && e <= 3);
    if (targetEnchants.length === 0) {
      return [];
    }
  }

  const { conditions: itemConditions, values: itemValues } = buildMultiValueConditions(
    { ...filters, tier },
    { tableAlias: "items", startIndex: 2 }
  );

  const qualityConditions = [];
  const qualityValues = [];
  if (quality !== null && quality !== "") {
    const parts = String(quality).split(",").map((part) => part.trim()).filter(Boolean);
    if (parts.length > 0) {
      const placeholders = parts.map((_, idx) => `$${2 + itemValues.length + idx}`).join(",");
      qualityValues.push(...parts);
      qualityConditions.push(`buy.quality IN (${placeholders})`);
    }
  }

  const values = [server, ...itemValues, ...qualityValues];

  const conditions = [
    "buy.server = $1",
    "buy.city IS DISTINCT FROM 'Black Market'",
    "buy.sell_price_min IS NOT NULL",
    "bm.sell_price_min IS NOT NULL",
    `bm.enchant IN (${targetEnchants.join(",")})`,
    "bm.enchant > buy.enchant",
    "items.tier >= 4",
    "items.shop_category IN ('armors', 'bags', 'head', 'shoes', 'capes', 'offhands')",
    ...itemConditions,
    ...qualityConditions
  ];

  if (buyCity) {
    values.push(buyCity);
    conditions.push(`buy.city = $${values.length}`);
  }

  const whereClause = conditions.join(" AND ");

  const queryText = `
    SELECT buy.unique_name,
           items.localized_names ->> 'EN-US' AS english_name,
           buy.enchant AS base_enchant,
           bm.enchant AS target_enchant,
           buy.quality,
           buy.city AS buy_city,
           buy.sell_price_min AS base_item_price,
           buy.sell_price_min_date AS buy_price_date,
           'Black Market'::text AS sell_city,
            bm.sell_price_min AS sell_price,
            bm.sell_price_min_date AS sell_price_date,
            bm30.bm_avg_30d,
            bm30.bm_sold_30d,
            items.shop_category,
           items.tier,
           rune.sell_price_min AS rune_price,
           soul.sell_price_min AS soul_price,
           relic.sell_price_min AS relic_price
    FROM item_prices_current AS buy
    JOIN items ON items.unique_name = buy.unique_name
    JOIN item_prices_current AS bm
      ON bm.server = buy.server
     AND bm.unique_name = buy.unique_name
     AND bm.enchant > buy.enchant
     AND bm.enchant <= 3
     AND bm.quality = 1
     AND bm.city = 'Black Market'
    LEFT JOIN item_bm_30d AS bm30
      ON bm30.server = buy.server
     AND bm30.unique_name = buy.unique_name
     AND bm30.enchant = bm.enchant
    LEFT JOIN item_prices_current AS rune
      ON rune.server = buy.server
     AND rune.city = buy.city
     AND rune.quality = 1
     AND rune.enchant = 0
     AND rune.unique_name = 'T' || items.tier || '_RUNE'
    LEFT JOIN item_prices_current AS soul
      ON soul.server = buy.server
     AND soul.city = buy.city
     AND soul.quality = 1
     AND soul.enchant = 0
     AND soul.unique_name = 'T' || items.tier || '_SOUL'
    LEFT JOIN item_prices_current AS relic
      ON relic.server = buy.server
     AND relic.city = buy.city
     AND relic.quality = 1
     AND relic.enchant = 0
     AND relic.unique_name = 'T' || items.tier || '_RELIC'
    WHERE ${whereClause}
  `;

  const result = await pool.query(queryText, values);
  return result.rows.map((row) => ({
    unique_name: row.unique_name,
    english_name: row.english_name,
    enchant: row.target_enchant,
    quality: row.quality,
    buy: {
      city: row.buy_city,
      sell_price_min: null,
      sell_price_min_date: row.buy_price_date,
    },
    sell: {
      city: row.sell_city,
      sell_price_min: row.sell_price,
      sell_price_min_date: row.sell_price_date,
    },
    is_upgrade: true,
    base_enchant: row.base_enchant,
    bm_avg_30d: row.bm_avg_30d,
    bm_sold_30d: row.bm_sold_30d,
    base_item_price: row.base_item_price,
    rune_price: row.rune_price,
    soul_price: row.soul_price,
    relic_price: row.relic_price,
    shop_category: row.shop_category,
    tier: row.tier,
  }));
};

module.exports = { getCurrentPrices, getFlipRows, getUpgradeFlipRows, _test: { buildFlipWhere } };
