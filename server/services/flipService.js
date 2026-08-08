const DEFAULT_TAX_MULTIPLIER = 0.935;
const DEFAULT_MIN_PROFIT = 1;

const computeFlipOpportunities = (
  variants,
  { taxMultiplier = DEFAULT_TAX_MULTIPLIER, minProfit = DEFAULT_MIN_PROFIT } = {}
) => {
  const opportunities = [];

  for (const variant of variants) {
    const { buy, sell, unique_name, english_name, enchant, quality } = variant;

    if (!buy || !sell || buy.city === sell.city) continue;
    if (!Number.isFinite(buy.sell_price_min) || !Number.isFinite(sell.sell_price_min)) continue;

    const buyPrice = buy.sell_price_min;
    const sellPrice = sell.sell_price_min;
    const revenue = Math.floor(sellPrice * taxMultiplier);
    const profit = revenue - buyPrice;

    if (profit < minProfit) continue;

    opportunities.push({
      unique_name,
      english_name,
      enchant,
      quality,
      buy_city: buy.city,
      sell_city: sell.city,
      buy_price: buyPrice,
      buy_price_date: buy.sell_price_min_date,
      sell_price: sellPrice,
      sell_price_date: sell.sell_price_min_date,
      profit,
      profit_percent: buyPrice > 0 ? Math.round((profit / buyPrice) * 100) : 0,
    });
  }

  opportunities.sort((a, b) => b.profit - a.profit);
  return opportunities;
};

module.exports = { computeFlipOpportunities };
