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

test("computeFlipOpportunities tính cơ hội nâng cấp nhiều bậc và áp dụng số lượng nguyên liệu chuẩn", () => {
  const variants = [
    {
      unique_name: "T4_ARMOR_PLATE",
      english_name: "Adept's Plate Armor",
      enchant: 3,
      quality: 1,
      buy: { city: "Lymhurst", sell_price_min_date: "2026-08-08T12:00:00Z" },
      sell: { city: "Black Market", sell_price_min: 100000, sell_price_min_date: "2026-08-08T12:00:00Z" },
      is_upgrade: true,
      base_enchant: 0,
      base_item_price: 5000,
      rune_price: 10,
      soul_price: 100,
      relic_price: 1000,
      shop_category: "armors",
      tier: 4
    },
    {
      unique_name: "T5_HEAD_PLATE",
      english_name: "Expert's Plate Helmet",
      enchant: 3,
      quality: 1,
      buy: { city: "Fort Sterling", sell_price_min_date: "2026-08-08T12:00:00Z" },
      sell: { city: "Black Market", sell_price_min: 50000, sell_price_min_date: "2026-08-08T12:00:00Z" },
      is_upgrade: true,
      base_enchant: 1,
      base_item_price: 10000,
      rune_price: 10,
      soul_price: 100,
      relic_price: 1000,
      shop_category: "head",
      tier: 5
    }
  ];

  const results = computeFlipOpportunities(variants);

  // T4 Armor: 192 each of Rune, Soul, Relic. Material cost = 192*(10+100+1000) = 213120.
  // Buy cost = 5000 + 213120 = 218120. BM sell = 100000. Revenue = floor(100000*0.935) = 93500.
  // Profit = 93500 - 218120 = -124620 (negative, filtered out).
  // T5 Head: 96 each of Soul, Relic. Material cost = 96*(100+1000) = 105600.
  // Buy cost = 10000 + 105600 = 115600. BM sell = 50000. Revenue = floor(50000*0.935) = 46750.
  // Profit = 46750 - 115600 = -68850 (negative, filtered out).
  // Both are filtered out, so results is empty.
  assert.equal(results.length, 0);
});

test("computeFlipOpportunities trả materials array cho nâng cấp nhiều bậc", () => {
  const variants = [
    {
      unique_name: "T4_ARMOR_PLATE",
      english_name: "Adept's Plate Armor",
      enchant: 2,
      quality: 1,
      buy: { city: "Lymhurst", sell_price_min_date: "2026-08-08T12:00:00Z" },
      sell: { city: "Black Market", sell_price_min: 300000, sell_price_min_date: "2026-08-08T12:00:00Z" },
      is_upgrade: true,
      base_enchant: 0,
      base_item_price: 5000,
      rune_price: 10,
      soul_price: 100,
      relic_price: 1000,
      shop_category: "armors",
      tier: 4
    }
  ];

  const results = computeFlipOpportunities(variants);

  // Material cost = 192*(10+100) = 21120. Buy cost = 5000 + 21120 = 26120.
  // Revenue = floor(300000*0.935) = 280500. Profit = 280500 - 26120 = 254380.
  assert.equal(results.length, 1);
  assert.deepEqual(results[0].materials, [
    { type: "RUNE", count: 192, price: 10 },
    { type: "SOUL", count: 192, price: 100 }
  ]);
  assert.equal(results[0].buy_price, 26120);
  assert.equal(results[0].base_enchant, 0);
  assert.equal(results[0].enchant, 2);
});
