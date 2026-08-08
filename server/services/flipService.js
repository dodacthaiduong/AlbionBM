const DEFAULT_TAX_MULTIPLIER = 0.935;
const DEFAULT_MIN_PROFIT = 1;

const computeFlipOpportunities = (
  variants,
  {
    taxMultiplier = DEFAULT_TAX_MULTIPLIER,
    minProfit = DEFAULT_MIN_PROFIT,
    minProfitPercent = 0,
  } = {}
) => {
  const opportunities = [];

  for (const variant of variants) {
    const {
      buy,
      sell,
      unique_name,
      english_name,
      enchant,
      quality,
      is_upgrade,
      base_enchant,
      base_item_price,
      material_price,
      material_price_date,
      shop_category,
      tier,
    } = variant;

    if (!sell) continue;
    if (!Number.isFinite(sell.sell_price_min)) continue;

    let buyPrice;
    let buyPriceDate = buy ? buy.sell_price_min_date : null;

    if (is_upgrade) {
      if (!Number.isFinite(base_item_price) || !Number.isFinite(material_price)) continue;
      const materialCount = ["armors", "bags"].includes(shop_category) ? 192 : 96;
      buyPrice = base_item_price + materialCount * material_price;
    } else {
      if (!buy || !Number.isFinite(buy.sell_price_min) || buy.city === sell.city) continue;
      buyPrice = buy.sell_price_min;
    }

    const sellPrice = sell.sell_price_min;
    const revenue = Math.floor(sellPrice * taxMultiplier);
    const profit = revenue - buyPrice;
    const profitPercent = buyPrice > 0 ? Math.round((profit / buyPrice) * 100) : 0;

    if (profit < minProfit) continue;
    if (profitPercent < minProfitPercent) continue;

    const opp = {
      unique_name,
      english_name,
      enchant,
      quality,
      buy_city: is_upgrade ? variant.buy.city : buy.city,
      sell_city: sell.city,
      buy_price: buyPrice,
      buy_price_date: is_upgrade ? (variant.buy.sell_price_min_date || material_price_date) : buy.sell_price_min_date,
      sell_price: sellPrice,
      sell_price_date: sell.sell_price_min_date,
      profit,
      profit_percent: profitPercent,
    };

    if (is_upgrade) {
      const materialCount = ["armors", "bags"].includes(shop_category) ? 192 : 96;
      opp.is_upgrade = true;
      opp.base_enchant = base_enchant;
      opp.base_item_price = base_item_price;
      opp.material_price = material_price;
      opp.material_count = materialCount;
      opp.material_type = base_enchant === 0 ? "RUNE" : base_enchant === 1 ? "SOUL" : "RELIC";
      opp.material_name = `T${tier}_${opp.material_type}`;
    }

    opportunities.push(opp);
  }

  opportunities.sort((a, b) => b.profit - a.profit);
  return opportunities;
};

module.exports = { computeFlipOpportunities };
