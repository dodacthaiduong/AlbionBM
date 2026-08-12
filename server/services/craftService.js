const BATCH_SIZE = 40;
const RETURN_RATE = 0.248;
const TAX_MULTIPLIER = 0.935;

const computeCraftProfits = (rows, { minProfitPercent = 0 } = {}) => {
  const results = [];

  for (const row of rows) {
    let totalMaterialCost = 0;
    let hasMissingPrice = false;

    for (const mat of row.materials) {
      if (mat.price === null || mat.price === undefined) {
        hasMissingPrice = true;
        break;
      }
      const totalNeeded = mat.count * BATCH_SIZE;
      const returned = Math.floor(totalNeeded * RETURN_RATE);
      const actualUsed = totalNeeded - returned;
      totalMaterialCost += actualUsed * mat.price;
    }

    if (hasMissingPrice) continue;

    const silverCost = row.silver * BATCH_SIZE;
    const totalCost = totalMaterialCost + silverCost;

    const effectiveSellPrice = row.current_bm_price !== null && row.current_bm_price < row.bm_avg_30d
      ? row.current_bm_price
      : row.bm_avg_30d;

    const revenue = Math.floor(effectiveSellPrice * BATCH_SIZE * TAX_MULTIPLIER);
    const profit = revenue - totalCost;
    const profitPercent = totalCost > 0 ? Math.round((profit / totalCost) * 100) : 0;

    if (minProfitPercent > 0 && profitPercent < minProfitPercent) continue;

    results.push({
      unique_name: row.item_unique_name,
      english_name: row.english_name,
      enchant_level: row.enchant_level,
      tier: row.tier,
      craft_time: row.craft_time,
      silver: row.silver,
      shop_category: row.shop_category,
      shop_subcategory1: row.shop_subcategory1,
      shop_subcategory2: row.shop_subcategory2,
      shop_subcategory3: row.shop_subcategory3,
      bm_avg_30d: row.bm_avg_30d,
      bm_sold_30d: row.bm_sold_30d,
      materials: row.materials,
      total_material_cost: totalMaterialCost,
      silver_cost: silverCost,
      total_cost: totalCost,
      sell_price: row.current_bm_price,
      effective_sell_price: effectiveSellPrice,
      revenue,
      profit,
      profit_percent: profitPercent,
    });
  }

  return results;
};

module.exports = { computeCraftProfits };
