const test = require("node:test");
const assert = require("node:assert/strict");
const { _test } = require("../controllers/flipController");

test("parseIntegerMulti giữ danh sách số hợp lệ trong khoảng", () => {
  assert.deepEqual(_test.parseIntegerMulti("4,5,6", { min: 1, max: 8 }), ["4", "5", "6"]);
  assert.deepEqual(_test.parseIntegerMulti("9,4", { min: 1, max: 8 }), ["4"]);
  assert.deepEqual(_test.parseIntegerMulti("abc,2", { min: 1, max: 8 }), ["2"]);
  assert.deepEqual(_test.parseIntegerMulti("", { min: 1, max: 8 }), []);
  assert.deepEqual(_test.parseIntegerMulti(undefined, { min: 1, max: 8 }), []);
});

test("parseTierFilter trả chuỗi CSV hoặc rỗng", () => {
  assert.equal(_test.parseTierFilter("4,5"), "4,5");
  assert.equal(_test.parseTierFilter("9"), "");
  assert.equal(_test.parseTierFilter(""), "");
});
