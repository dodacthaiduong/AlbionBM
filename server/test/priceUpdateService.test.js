const test = require("node:test");
const assert = require("node:assert/strict");

process.env.PORT = "3001";
process.env.CORS_ORIGIN = "http://localhost:5173";
process.env.ALBION_API_ASIA_URL = "https://prices.internal.example.com";
process.env.ALBION_API_AMERICA_URL = "https://america.example.com";
process.env.ALBION_API_EUROPE_URL = "https://europe.example.com";

const { _test } = require("../services/priceUpdateService");

test("generateItemEntries sinh đủ enchant từ 0 đến max_enchant", () => {
  assert.deepEqual(
    _test.generateItemEntries({ unique_name: "T4_BAG", max_enchant: 3 }),
    [
      { itemId: "T4_BAG", uniqueName: "T4_BAG", enchant: 0 },
      { itemId: "T4_BAG@1", uniqueName: "T4_BAG", enchant: 1 },
      { itemId: "T4_BAG@2", uniqueName: "T4_BAG", enchant: 2 },
      { itemId: "T4_BAG@3", uniqueName: "T4_BAG", enchant: 3 },
    ]
  );
});

test("createBatches không tạo URL vượt quá 4096 byte và không mất item", () => {
  const entries = Array.from({ length: 600 }, (_, index) => ({
    itemId: `T8_ITEM_WITH_A_LONG_UNIQUE_NAME_${String(index).padStart(4, "0")}@4`,
    uniqueName: `T8_ITEM_WITH_A_LONG_UNIQUE_NAME_${String(index).padStart(4, "0")}`,
    enchant: 4,
  }));

  const batches = _test.createBatches(
    _test.SERVER_BASE_URLS.asia,
    entries,
    [1, 2, 3, 4, 5]
  );

  assert.ok(batches.length > 1);
  assert.deepEqual(batches.flatMap((batch) => batch.entries), entries);
  for (const batch of batches) {
    assert.ok(Buffer.byteLength(batch.url, "utf8") <= _test.MAX_URL_BYTES);
  }
});

test("createBatches dùng URL thật đã encode khi tính kích thước", () => {
  const entry = { itemId: "T4_BAG@1", uniqueName: "T4_BAG", enchant: 1 };
  const [batch] = _test.createBatches(_test.SERVER_BASE_URLS.asia, [entry], [1]);

  assert.match(batch.url, /T4_BAG%401\.json/);
  assert.match(batch.url, /Fort\+Sterling/);
  assert.match(batch.url, /Black\+Market/);
  assert.equal(batch.url, _test.buildPriceUrl(_test.SERVER_BASE_URLS.asia, [entry.itemId], [1]));
});

test("mapApiRows tách item_id và chuẩn hóa giá 0/ngày năm 0001 thành null", () => {
  const batch = {
    entries: [{ itemId: "T4_BAG@1", uniqueName: "T4_BAG", enchant: 1 }],
    qualities: [1],
  };
  const rows = _test.mapApiRows(
    [
      {
        item_id: "T4_BAG@1",
        city: "Caerleon",
        quality: 1,
        sell_price_min: 0,
        sell_price_min_date: "0001-01-01T00:00:00",
        sell_price_max: 5000,
        sell_price_max_date: "2026-08-03T10:00:00",
        buy_price_min: 0,
        buy_price_min_date: "0001-01-01T00:00:00",
        buy_price_max: 4000,
        buy_price_max_date: "2026-08-03T09:00:00",
      },
    ],
    batch,
    "asia",
    "2026-08-03T11:00:00.000Z"
  );

  assert.equal(rows.length, 1);
  assert.equal(rows[0].uniqueName, "T4_BAG");
  assert.equal(rows[0].enchant, 1);
  assert.equal(rows[0].sellPriceMin, null);
  assert.equal(rows[0].sellPriceMinDate, null);
  assert.equal(rows[0].sellPriceMax, 5000);
  assert.equal(rows[0].sellPriceMaxDate, "2026-08-03T10:00:00.000Z");
});

test("mapApiRows giữ dòng toàn giá 0 để xóa giá current đã cũ", () => {
  const rows = _test.mapApiRows(
    [
      {
        item_id: "T4_BAG",
        city: "Caerleon",
        quality: 1,
        sell_price_min: 0,
        sell_price_min_date: "0001-01-01T00:00:00",
        sell_price_max: 0,
        sell_price_max_date: "0001-01-01T00:00:00",
        buy_price_min: 0,
        buy_price_min_date: "0001-01-01T00:00:00",
        buy_price_max: 0,
        buy_price_max_date: "0001-01-01T00:00:00",
      },
    ],
    {
      entries: [{ itemId: "T4_BAG", uniqueName: "T4_BAG", enchant: 0 }],
      qualities: [1],
    },
    "asia",
    "2026-08-03T11:00:00.000Z"
  );

  assert.equal(rows.length, 1);
  assert.equal(rows[0].sellPriceMin, null);
  assert.equal(rows[0].buyPriceMax, null);
});

test("SERVER_BASE_URLS uses configured region endpoint", () => {
  assert.equal(_test.SERVER_BASE_URLS.asia, "https://prices.internal.example.com");
});

test("createBatches preserves injected endpoint", () => {
  const configuredUrl = _test.SERVER_BASE_URLS.asia;
  const entry = { itemId: "T4_BAG", uniqueName: "T4_BAG", enchant: 0 };
  const [batch] = _test.createBatches(configuredUrl, [entry], [1]);

  assert.match(batch.url, /^https:\/\/prices\.internal\.example\.com\/api\/v2\/stats\/prices\//);
  assert.doesNotMatch(batch.url, /albion-online-data\.com/);
});
