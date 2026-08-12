const pool = require("../config/db");
const { escapeLiteral } = require("pg");
const { buildMultiValueConditions } = require("../utils/shopFilters");

const PREFERRED_CITIES = {
  METALBAR: "Thetford",
  METALINGOT: "Thetford",
  LEATHER: "Martlock",
  CLOTH: "Lymhurst",
  PLANKS: "Fort Sterling",
  WOOD: "Fort Sterling",
};

const getPreferredCity = (materialName) => {
  for (const [keyword, city] of Object.entries(PREFERRED_CITIES)) {
    if (materialName.includes(keyword)) return city;
  }
  return null;
};

const getBestPrice = (prices, materialName) => {
  const preferredCity = getPreferredCity(materialName);
  let preferred = null;
  let cheapest = null;

  for (const p of prices) {
    if (p.sell_price_min === null || p.sell_price_min === undefined) continue;
    if (preferredCity && p.city === preferredCity) {
      if (preferred === null || p.sell_price_min < preferred) {
        preferred = p.sell_price_min;
      }
    }
    if (cheapest === null || p.sell_price_min < cheapest) {
      cheapest = p.sell_price_min;
    }
  }

  return preferred !== null ? preferred : cheapest;
};

const getCraftData = async ({ server, filters = {}, tier = null, enchant = null }) => {
  const { conditions: filterConditions, values: filterValues } =
    buildMultiValueConditions(
      { ...filters, tier, enchant },
      { tableAlias: "items", startIndex: 2 }
    );

  const values = [server, ...filterValues];
  const conditions = [
    "r.item_unique_name = items.unique_name",
    "bm.server = $1",
    "bm.unique_name = r.item_unique_name",
    "bm.enchant = r.enchant_level",
    "bm.bm_avg_30d IS NOT NULL",
    ...filterConditions,
  ];
  const whereClause = conditions.join(" AND ");

  const recipeResult = await pool.query(
    `SELECT r.item_unique_name,
            r.enchant_level,
            r.craft_time,
            r.silver,
            r.crafting_focus,
            items.localized_names ->> 'EN-US' AS english_name,
            items.tier,
            items.shop_category,
            items.shop_subcategory1,
            items.shop_subcategory2,
            items.shop_subcategory3,
            bm.bm_avg_30d,
            bm.bm_sold_30d,
            ip.sell_price_min AS current_bm_price
     FROM crafting_recipes r
     JOIN items ON items.unique_name = r.item_unique_name
     JOIN item_bm_30d bm
       ON bm.unique_name = r.item_unique_name
      AND bm.enchant = r.enchant_level
      AND bm.server = $1
     LEFT JOIN item_prices_current ip
       ON ip.server = bm.server
      AND ip.unique_name = r.item_unique_name
      AND ip.enchant = r.enchant_level
      AND ip.city = 'Black Market'
      AND ip.quality = 1
     WHERE ${whereClause}
     ORDER BY bm.bm_avg_30d DESC`,
    values
  );

  if (recipeResult.rows.length === 0) {
    return { rows: [], total: 0 };
  }

  const recipeKeys = recipeResult.rows.map(
    (r) => `(${escapeLiteral(r.item_unique_name)}, ${r.enchant_level})`
  );

  const materialResult = await pool.query(
    `SELECT rm.item_unique_name,
            rm.enchant_level,
            rm.material_unique_name,
            rm.count,
            items.localized_names ->> 'EN-US' AS material_name
     FROM crafting_recipe_materials rm
     JOIN items ON items.unique_name = rm.material_unique_name
     WHERE (rm.item_unique_name, rm.enchant_level) IN (${recipeKeys.join(",")})`
  );

  const allMaterialNames = [...new Set(materialResult.rows.map((r) => r.material_unique_name))];

  let priceRows = [];
  if (allMaterialNames.length > 0) {
    const pricePlaceholders = allMaterialNames.map((_, i) => `$${i + 2}`).join(",");
    const priceResult = await pool.query(
      `SELECT unique_name, city, sell_price_min
       FROM item_prices_current
       WHERE server = $1
         AND quality = 1
         AND enchant = 0
         AND unique_name IN (${pricePlaceholders})
         AND sell_price_min IS NOT NULL`,
      [server, ...allMaterialNames]
    );
    priceRows = priceResult.rows;
  }

  const materialPriceMap = {};
  for (const row of priceRows) {
    if (!materialPriceMap[row.unique_name]) {
      materialPriceMap[row.unique_name] = [];
    }
    materialPriceMap[row.unique_name].push(row);
  }

  const materialsByRecipe = {};
  for (const row of materialResult.rows) {
    const key = `${row.item_unique_name}|${row.enchant_level}`;
    if (!materialsByRecipe[key]) materialsByRecipe[key] = [];
    materialsByRecipe[key].push(row);
  }

  const rows = recipeResult.rows.map((recipe) => {
    const key = `${recipe.item_unique_name}|${recipe.enchant_level}`;
    const materials = materialsByRecipe[key] || [];
    const materialCosts = materials.map((mat) => {
      const prices = materialPriceMap[mat.material_unique_name] || [];
      const price = getBestPrice(prices, mat.material_unique_name);
      return {
        material_unique_name: mat.material_unique_name,
        material_name: mat.material_name,
        count: mat.count,
        price: price,
      };
    });

    return {
      ...recipe,
      materials: materialCosts,
    };
  });

  return { rows, total: rows.length };
};

module.exports = { getCraftData, _test: { getPreferredCity, getBestPrice } };
