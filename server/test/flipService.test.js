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

test("computeFlipOpportunities tính cơ hội nâng cấp và áp dụng số lượng nguyên liệu chuẩn", () => {
  const variants = [
    {
      unique_name: "T4_ARMOR_PLATE",
      english_name: "Adept's Plate Armor",
      enchant: 1,
      quality: 1,
      buy: { city: "Lymhurst", sell_price_min_date: "2026-08-08T12:00:00Z" },
      sell: { city: "Black Market", sell_price_min: 30000, sell_price_min_date: "2026-08-08T12:00:00Z" },
      is_upgrade: true,
      base_enchant: 0,
      base_item_price: 5000,
      material_price: 10,
      material_price_date: "2026-08-08T12:00:00Z",
      shop_category: "armors",
      tier: 4
    },
    {
      unique_name: "T5_HEAD_PLATE",
      english_name: "Expert's Plate Helmet",
      enchant: 2,
      quality: 1,
      buy: { city: "Fort Sterling", sell_price_min_date: "2026-08-08T12:00:00Z" },
      sell: { city: "Black Market", sell_price_min: 50000, sell_price_min_date: "2026-08-08T12:00:00Z" },
      is_upgrade: true,
      base_enchant: 1,
      base_item_price: 10000,
      material_price: 100,
      material_price_date: "2026-08-08T12:00:00Z",
      shop_category: "head",
      tier: 5
    }
  ];

  const results = computeFlipOpportunities(variants);

  // T4 Armor upgrade count = 192. Buy cost = 5000 + 192 * 10 = 6920.
  // BM sell = 30000. Revenue = floor(30000 * 0.935) = 28050.
  // Profit = 28050 - 6920 = 21130. Profit % = round(21130 / 6920 * 100) = 305%
  assert.equal(results.length, 2);
  assert.deepEqual(results[1], {
    unique_name: "T4_ARMOR_PLATE",
    english_name: "Adept's Plate Armor",
    enchant: 1,
    quality: 1,
    buy_city: "Lymhurst",
    sell_city: "Black Market",
    buy_price: 6920,
    buy_price_date: "2026-08-08T12:00:00Z",
    sell_price: 30000,
    sell_price_date: "2026-08-08T12:00:00Z",
    profit: 21130,
    profit_percent: 305,
    is_upgrade: true,
    base_enchant: 0,
    base_item_price: 5000,
    material_price: 10,
    material_count: 192,
    material_type: "RUNE",
    material_name: "T4_RUNE"
  });

  // T5 Head upgrade count = 96. Buy cost = 10000 + 96 * 100 = 19600.
  // BM sell = 50000. Revenue = floor(50000 * 0.935) = 46750.
  // Profit = 46750 - 19600 = 27150. Profit % = round(27150 / 19600 * 100) = 139%
  assert.deepEqual(results[0], {
    unique_name: "T5_HEAD_PLATE",
    english_name: "Expert's Plate Helmet",
    enchant: 2,
    quality: 1,
    buy_city: "Fort Sterling",
    sell_city: "Black Market",
    buy_price: 19600,
    buy_price_date: "2026-08-08T12:00:00Z",
    sell_price: 50000,
    sell_price_date: "2026-08-08T12:00:00Z",
    profit: 27150,
    profit_percent: 139,
    is_upgrade: true,
    base_enchant: 1,
    base_item_price: 10000,
    material_price: 100,
    material_count: 96,
    material_type: "SOUL",
    material_name: "T5_SOUL"
  });
});
