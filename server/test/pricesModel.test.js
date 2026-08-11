const test = require("node:test");
const assert = require("node:assert/strict");
const { _test } = require("../models/pricesModel");

test("buildFlipWhere kết hợp IN cho shop và tier/enchant/quality", () => {
  const { whereClause, values } = _test.buildFlipWhere({
    filters: { shop_category: "Weapon,Armor" },
    tier: "4,5",
    enchant: null,
    quality: "1,2",
  });
  assert.match(whereClause, /prices\.server = \$1/);
  assert.match(whereClause, /items\.shop_category IN \(\$2,\$3\)/);
  assert.match(whereClause, /items\.tier IN \(\$4,\$5\)/);
  assert.match(whereClause, /prices\.quality IN \(\$6,\$7\)/);
  assert.deepEqual(values, ["Weapon", "Armor", "4", "5", "1", "2"]);
});

test("buildFlipWhere giữ sell_price_min IS NOT NULL", () => {
  const { whereClause } = _test.buildFlipWhere({ filters: {} });
  assert.match(whereClause, /prices\.sell_price_min IS NOT NULL/);
});

test("buildFlipWhere thêm điều kiện city khi có buyCity", () => {
  const { whereClause, values } = _test.buildFlipWhere({
    filters: {},
    buyCity: "Lymhurst",
  });
  assert.match(whereClause, /prices\.city = \$\d/);
  assert.ok(values.includes("Lymhurst"));
});

test("buildFlipWhere không thêm city khi buyCity null", () => {
  const { whereClause, values } = _test.buildFlipWhere({ filters: {} });
  assert.doesNotMatch(whereClause, /prices\.city =/);
  assert.deepEqual(values, []);
});
