const test = require("node:test");
const assert = require("node:assert/strict");
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
