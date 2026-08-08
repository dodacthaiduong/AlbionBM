const test = require("node:test");
const assert = require("node:assert/strict");
const { computeFlipOpportunities } = require("../services/flipService");

test("computeFlipOpportunities tính lời sau thuế và lọc flip không lời", () => {
  const variants = [
    {
      unique_name: "T4_BAG",
      english_name: "Bag",
      enchant: 0,
      quality: 1,
      buy: { city: "Thetford", sell_price_min: 100 },
      sell: { city: "Caerleon", sell_price_min: 200 },
    },
    {
      unique_name: "T5_BAG",
      english_name: "Bag5",
      enchant: 1,
      quality: 2,
      buy: { city: "Bridgewatch", sell_price_min: 1000 },
      sell: { city: "Bridgewatch", sell_price_min: 1000 },
    },
    {
      unique_name: "T6_SWORD",
      english_name: "Sword",
      enchant: 0,
      quality: 1,
      buy: { city: "Martlock", sell_price_min: 500 },
      sell: { city: "Lymhurst", sell_price_min: 490 },
    },
  ];

  const results = computeFlipOpportunities(variants);

  assert.equal(results.length, 1);
  assert.deepEqual(results[0], {
    unique_name: "T4_BAG",
    english_name: "Bag",
    enchant: 0,
    quality: 1,
    buy_city: "Thetford",
    sell_city: "Caerleon",
    buy_price: 100,
    buy_price_date: undefined,
    sell_price: 200,
    sell_price_date: undefined,
    profit: 87,
    profit_percent: 87,
  });
});
