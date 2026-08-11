const test = require("node:test");
const assert = require("node:assert/strict");
const {
  parseMultiValue,
  buildMultiValueConditions,
} = require("../utils/shopFilters");

test("parseMultiValue tách CSV, trim và bỏ token rỗng", () => {
  assert.deepEqual(parseMultiValue("Foo,Bar ,Baz"), ["Foo", "Bar", "Baz"]);
  assert.deepEqual(parseMultiValue("Foo,,Bar"), ["Foo", "Bar"]);
  assert.deepEqual(parseMultiValue(" , , "), []);
  assert.deepEqual(parseMultiValue(""), []);
  assert.deepEqual(parseMultiValue(undefined), []);
  assert.deepEqual(parseMultiValue(null), []);
  assert.deepEqual(parseMultiValue(123), []);
});

test("buildMultiValueConditions tạo IN cho nhiều trường", () => {
  const filters = {
    shop_category: "Weapon, Armor",
    shop_subcategory1: "",
    tier: "4,5,6",
  };
  const { conditions, values } = buildMultiValueConditions(filters, {
    startIndex: 2,
  });
  assert.equal(conditions[0], "items.shop_category::text IN ($2,$3)");
  assert.equal(conditions[1], "items.tier::text IN ($4,$5,$6)");
  assert.deepEqual(values, ["Weapon", "Armor", "4", "5", "6"]);
});

test("buildMultiValueConditions bỏ qua trường rỗng", () => {
  const { conditions, values } = buildMultiValueConditions(
    { shop_category: "", tier: "   " },
    { startIndex: 1 }
  );
  assert.equal(conditions.length, 0);
  assert.deepEqual(values, []);
});
