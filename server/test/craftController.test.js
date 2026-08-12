const test = require("node:test");
const assert = require("node:assert/strict");

process.env.PORT = "3001";
process.env.CORS_ORIGIN = "http://localhost:5173";
process.env.ALBION_API_ASIA_URL = "https://prices.internal.example.com";
process.env.ALBION_API_AMERICA_URL = "https://america.example.com";
process.env.ALBION_API_EUROPE_URL = "https://europe.example.com";

const { getCraftOpportunities, _test } = require("../controllers/craftController");

test("getCraftOpportunities trả về 400 cho server không hợp lệ", async () => {
  const req = { query: { server: "mars" } };
  const res = {
    status: (code) => ({ json: (data) => ({ statusCode: code, body: data }) }),
  };
  const result = await getCraftOpportunities(req, res);
  assert.equal(result.statusCode, 400);
});

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

test("parseEnchantFilter chỉ chấp nhận 0-4", () => {
  assert.equal(_test.parseEnchantFilter("0,4"), "0,4");
  assert.equal(_test.parseEnchantFilter("5"), "");
});

test("parseIntegerFilter trả null cho input không hợp lệ", () => {
  assert.equal(_test.parseIntegerFilter("abc"), null);
  assert.equal(_test.parseIntegerFilter(""), null);
  assert.equal(_test.parseIntegerFilter(undefined), null);
  assert.equal(_test.parseIntegerFilter("10", { min: 0 }), 10);
  assert.equal(_test.parseIntegerFilter("5", { min: 0, max: 10 }), 5);
});
