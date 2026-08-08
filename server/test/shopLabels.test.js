const test = require("node:test");
const assert = require("node:assert/strict");
const { cleanItemName, humanizeKey } = require("../utils/shopLabels");

test("cleanItemName loại bỏ các tiền tố Tiers, Quality, Tame", () => {
  assert.equal(cleanItemName("Adept's Scholar Robe"), "Scholar Robe");
  assert.equal(cleanItemName("Elder's Scholar Robe"), "Scholar Robe");
  assert.equal(cleanItemName("Novice's Scholar Robe"), "Scholar Robe");
  assert.equal(cleanItemName("Tame Direbear"), "Direbear");
  assert.equal(cleanItemName("Major Acid Potion"), "Acid Potion");
  assert.equal(cleanItemName("Grandmaster's Cleric Robe"), "Cleric Robe");
});

test("humanizeKey chuyển đổi snake_case / camelCase thành Tiêu Đề Đẹp", () => {
  assert.equal(humanizeKey("cloth_armor"), "Cloth Armor");
  assert.equal(humanizeKey("arcanestaff"), "Arcanestaff");
  assert.equal(humanizeKey("capes avalon"), "Capes Avalon");
  assert.equal(humanizeKey(""), "");
});
