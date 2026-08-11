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
      rune_price,
      soul_price,
      relic_price,
      shop_category,
      tier,
    } = variant;

    if (!sell) continue;
    if (!Number.isFinite(sell.sell_price_min)) continue;

    let buyPrice;
    let buyPriceDate = buy ? buy.sell_price_min_date : null;
    let materials = [];

    if (is_upgrade) {
      if (!Number.isFinite(base_item_price)) continue;
      const materialCount = ["armors", "bags"].includes(shop_category) ? 192 : 96;
      const materialDefs = [
        { step: 0, type: "RUNE", price: rune_price },
        { step: 1, type: "SOUL", price: soul_price },
        { step: 2, type: "RELIC", price: relic_price },
      ];
      let materialCost = 0;
      let valid = true;
      for (let e = base_enchant; e < enchant; e++) {
        const def = materialDefs.find((d) => d.step === e);
        if (!def || !Number.isFinite(def.price)) {
          valid = false;
          break;
        }
        materialCost += materialCount * def.price;
        materials.push({ type: def.type, count: materialCount, price: def.price });
      }
      if (!valid) continue;
      buyPrice = base_item_price + materialCost;
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
      buy_price_date: is_upgrade ? buyPriceDate : buy.sell_price_min_date,
      sell_price: sellPrice,
      sell_price_date: sell.sell_price_min_date,
      bm_avg_30d: variant.bm_avg_30d,
      profit,
      profit_percent: profitPercent,
    };

    if (is_upgrade) {
      opp.is_upgrade = true;
      opp.base_enchant = base_enchant;
      opp.base_item_price = base_item_price;
      opp.materials = materials;
    }

    opportunities.push(opp);
  }

  opportunities.sort((a, b) => b.profit - a.profit);
  return opportunities;
};

module.exports = { computeFlipOpportunities };
