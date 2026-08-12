const { describe, it } = require("node:test");
const assert = require("node:assert");
const { computeCraftProfits } = require("../services/craftService");

describe("computeCraftProfits", () => {
  const sampleRows = [
    {
      item_unique_name: "T4_HEAD_CLOTH_SET1",
      english_name: "T4 Cloth Helm",
      enchant_level: 0,
      tier: 4,
      craft_time: 1.5,
      silver: 500,
      bm_avg_30d: 50000,
      bm_sold_30d: 100,
      current_bm_price: 52000,
      materials: [
        { material_unique_name: "T4_CLOTH", material_name: "T4 Cloth", count: 8, price: 500 },
        { material_unique_name: "T4_PLANKS", material_name: "T4 Planks", count: 4, price: 300 },
      ],
    },
  ];

  it("should calculate material cost with 24.8% return rate", () => {
    const results = computeCraftProfits(sampleRows);
    // T4_CLOTH: 8*40=320, return=floor(320*0.248)=floor(79.36)=79, used=320-79=241, cost=241*500=120500
    // T4_PLANKS: 4*40=160, return=floor(160*0.248)=floor(39.68)=39, used=160-39=121, cost=121*300=36300
    // total_material = 120500+36300 = 156800
    // silver = 500*40 = 20000
    // total_cost = 156800+20000 = 176800
    // effective_sell = min(50000,52000)*0.935 = 46750
    // revenue = floor(46750) = 46750
    // profit = 46750 - 176800 = -130050
    assert.strictEqual(results.length, 1);
    assert.strictEqual(results[0].total_material_cost, 156800);
    assert.strictEqual(results[0].silver_cost, 20000);
    assert.strictEqual(results[0].total_cost, 176800);
    assert.strictEqual(results[0].revenue, 46750);
    assert.strictEqual(results[0].profit, -130050);
  });

  it("should filter by minProfitPercent", () => {
    const results = computeCraftProfits(sampleRows, { minProfitPercent: 10 });
    assert.strictEqual(results.length, 0);
  });

  it("should handle missing material prices", () => {
    const rows = [
      {
        ...sampleRows[0],
        materials: [
          { material_unique_name: "T4_CLOTH", material_name: "T4 Cloth", count: 8, price: null },
        ],
      },
    ];
    const results = computeCraftProfits(rows);
    assert.strictEqual(results.length, 0);
  });
});
