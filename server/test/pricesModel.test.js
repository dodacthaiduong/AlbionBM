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
  assert.match(whereClause, /items\.shop_category::text IN \(\$2,\$3\)/);
  assert.match(whereClause, /items\.tier::text IN \(\$4,\$5\)/);
  assert.match(whereClause, /prices\.quality::text IN \(\$6,\$7\)/);
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
  assert.match(whereClause, /prices\.city = \$2/);
  assert.ok(values.includes("Lymhurst"));
});

test("buildFlipWhere buyCity không trùng placeholder với tier/enchant", () => {
  const { whereClause, values } = _test.buildFlipWhere({
    filters: {},
    tier: "8,7,6",
    enchant: "0,1",
    buyCity: "Brecilien",
  });
  assert.match(whereClause, /prices\.enchant::text IN \(\$5,\$6\)/);
  assert.match(whereClause, /prices\.city = \$7/);
  assert.deepEqual(values, ["8", "7", "6", "0", "1", "Brecilien"]);
});

test("buildFlipWhere không thêm city khi buyCity null", () => {
  const { whereClause, values } = _test.buildFlipWhere({ filters: {} });
  assert.doesNotMatch(whereClause, /prices\.city =/);
  assert.deepEqual(values, []);
});
