const test = require("node:test");
const assert = require("node:assert/strict");
const pool = require("../config/db");
const craftModel = require("../models/craftModel");
const { _test } = require("../models/craftModel");

const { getPreferredCity, getBestPrice } = _test;

test("getPreferredCity mapeia materiais para cidades preferidas", () => {
  assert.equal(getPreferredCity("T4_METALBAR"), "Thetford");
  assert.equal(getPreferredCity("T4_METALINGOT"), "Thetford");
  assert.equal(getPreferredCity("T4_LEATHER"), "Martlock");
  assert.equal(getPreferredCity("T4_CLOTH"), "Lymhurst");
  assert.equal(getPreferredCity("T4_PLANKS"), "Fort Sterling");
  assert.equal(getPreferredCity("T4_WOOD"), "Fort Sterling");
});

test("getPreferredCity retorna null para material desconhecido", () => {
  assert.equal(getPreferredCity("T4_ORE"), null);
  assert.equal(getPreferredCity(""), null);
});

test("getBestPrice prefere preço da cidade preferida quando disponível", () => {
  const prices = [
    { unique_name: "T4_CLOTH", city: "Lymhurst", sell_price_min: 500 },
    { unique_name: "T4_CLOTH", city: "Thetford", sell_price_min: 550 },
  ];
  assert.equal(getBestPrice(prices, "T4_CLOTH"), 500);
});

test("getBestPrice usa o mais barato quando cidade preferida ausente", () => {
  const prices = [
    { unique_name: "T4_CLOTH", city: "Thetford", sell_price_min: 550 },
    { unique_name: "T4_CLOTH", city: "Martlock", sell_price_min: 400 },
  ];
  assert.equal(getBestPrice(prices, "T4_CLOTH"), 400);
});

test("getBestPrice ignora preços null", () => {
  const prices = [
    { unique_name: "T4_CLOTH", city: "Lymhurst", sell_price_min: null },
    { unique_name: "T4_CLOTH", city: "Thetford", sell_price_min: 550 },
  ];
  assert.equal(getBestPrice(prices, "T4_CLOTH"), 550);
});

test("getBestPrice retorna null quando não há preços válidos", () => {
  assert.equal(getBestPrice([], "T4_CLOTH"), null);
  assert.equal(
    getBestPrice([{ unique_name: "T4_CLOTH", city: "Lymhurst", sell_price_min: null }], "T4_CLOTH"),
    null
  );
});

test("getCraftData retorna vazio quando nenhuma receita encontrada", async (t) => {
  t.mock.method(pool, "query", async () => ({ rows: [] }));

  const result = await craftModel.getCraftData({ server: "asia" });

  assert.deepStrictEqual(result, { rows: [], total: 0 });
  assert.strictEqual(pool.query.mock.callCount(), 1);
});

test("getCraftData retorna receitas com materiais e precos via getBestPrice", async (t) => {
  const recipeRows = [
    {
      item_unique_name: "T4_HEAD_CLOTH_SET1",
      enchant_level: 0,
      craft_time: 1.5,
      silver: 500,
      crafting_focus: 429,
      bm_avg_30d: 50000,
      bm_sold_30d: 100.5,
      current_bm_price: 52000,
    },
  ];
  const materialRows = [
    {
      item_unique_name: "T4_HEAD_CLOTH_SET1",
      enchant_level: 0,
      material_unique_name: "T4_CLOTH",
      count: 8,
      material_name: "T4 Cloth",
    },
  ];
  const priceRows = [
    { unique_name: "T4_CLOTH", city: "Lymhurst", sell_price_min: 500 },
    { unique_name: "T4_CLOTH", city: "Thetford", sell_price_min: 550 },
  ];

  t.mock.method(pool, "query", async (queryText) => {
    if (queryText.includes("crafting_recipes")) return { rows: recipeRows };
    if (queryText.includes("crafting_recipe_materials")) return { rows: materialRows };
    return { rows: priceRows };
  });

  const result = await craftModel.getCraftData({ server: "asia" });

  assert.strictEqual(result.rows.length, 1);
  assert.strictEqual(result.rows[0].item_unique_name, "T4_HEAD_CLOTH_SET1");
  assert.strictEqual(result.rows[0].materials.length, 1);
  assert.strictEqual(result.rows[0].materials[0].material_unique_name, "T4_CLOTH");
  assert.strictEqual(result.rows[0].materials[0].count, 8);
  assert.strictEqual(result.rows[0].materials[0].price, 500);
  assert.strictEqual(result.total, 1);
});
