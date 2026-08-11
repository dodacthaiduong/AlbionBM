const test = require("node:test");
const assert = require("node:assert/strict");

process.env.PORT = "3001";
process.env.CORS_ORIGIN = "http://localhost:5173";
process.env.ALBION_API_ASIA_URL = "https://prices.internal.example.com";
process.env.ALBION_API_AMERICA_URL = "https://america.example.com";
process.env.ALBION_API_EUROPE_URL = "https://europe.example.com";

const { _test } = require("../routes/services/priceUpdateService");

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

test("buildHistoryUrl tạo URL history với date, end_date, time-scale=24", () => {
  const url = _test.buildHistoryUrl(
    "https://east.example.com",
    ["T4_BAG@1"],
    [1],
    "2018-01-01",
    "2026-08-10"
  );
  assert.match(url, /\/api\/v2\/stats\/history\/T4_BAG%401\.json/);
  assert.match(url, /date=2018-01-01/);
  assert.match(url, /end_date=2026-08-10/);
  assert.match(url, /time-scale=24/);
  assert.match(url, /locations=/);
  assert.match(url, /qualities=1/);
});

test("createBatches dùng urlBuilder tùy chỉnh khi được truyền", () => {
  const entry = { itemId: "T4_BAG", uniqueName: "T4_BAG", enchant: 0 };
  const urlBuilder = (base, ids, q) =>
    `https://custom.example.com/history/${ids.join(",")}?q=${q.join(",")}`;
  const [batch] = _test.createBatches("https://base.example.com", [entry], [1], urlBuilder);
  assert.match(batch.url, /custom\.example\.com\/history\/T4_BAG/);
});

test("createBatches preserves injected endpoint", () => {
  const configuredUrl = _test.SERVER_BASE_URLS.asia;
  const entry = { itemId: "T4_BAG", uniqueName: "T4_BAG", enchant: 0 };
  const [batch] = _test.createBatches(configuredUrl, [entry], [1]);

  assert.match(batch.url, /^https:\/\/prices\.internal\.example\.com\/api\/v2\/stats\/prices\//);
  assert.doesNotMatch(batch.url, /albion-online-data\.com/);
});

test("mapHistoryRows map location→city, tách enchant, chuẩn hóa timestamp", () => {
  const batch = {
    entries: [{ itemId: "T4_BAG@1", uniqueName: "T4_BAG", enchant: 1 }],
    qualities: [1],
  };
  const rows = _test.mapHistoryRows(
    [
      {
        item_id: "T4_BAG@1",
        location: "Caerleon",
        quality: 1,
        data: [
          { item_count: 13, avg_price: 3410, timestamp: "2026-07-11T00:00:00" },
          { item_count: 5, avg_price: 0, timestamp: 1780000000000 },
        ],
      },
    ],
    batch,
    "asia",
    "2026-08-10T00:00:00.000Z"
  );

  assert.equal(rows.length, 2);
  assert.equal(rows[0].city, "Caerleon");
  assert.equal(rows[0].uniqueName, "T4_BAG");
  assert.equal(rows[0].enchant, 1);
  assert.equal(rows[0].avgPrice, 3410);
  assert.equal(rows[0].itemCount, 13);
  assert.equal(rows[0].priceDate, "2026-07-11T00:00:00.000Z");
  assert.equal(rows[1].avgPrice, null);
  assert.equal(rows[1].priceDate, new Date(1780000000000).toISOString());
});

test("mapHistoryRows bỏ location/quality không hợp lệ", () => {
  const batch = {
    entries: [{ itemId: "T4_BAG", uniqueName: "T4_BAG", enchant: 0 }],
    qualities: [1],
  };
  const rows = _test.mapHistoryRows(
    [
      {
        item_id: "T4_BAG",
        location: "Unknown City",
        quality: 1,
        data: [{ item_count: 1, avg_price: 5, timestamp: "2026-07-11T00:00:00" }],
      },
      {
        item_id: "T4_BAG",
        location: "Caerleon",
        quality: 3,
        data: [{ item_count: 1, avg_price: 5, timestamp: "2026-07-11T00:00:00" }],
      },
    ],
    batch,
    "asia",
    "2026-08-10T00:00:00.000Z"
  );

  assert.equal(rows.length, 0);
});

test("buildHistoryValuesClause tạo placeholders với cast đúng", () => {
  const { sql, values } = _test.buildHistoryValuesClause([
    {
      server: "asia",
      uniqueName: "T4_BAG",
      enchant: 0,
      city: "Caerleon",
      quality: 1,
      priceDate: "2026-07-11T00:00:00.000Z",
      avgPrice: 3410,
      itemCount: 13,
      fetchedAt: "2026-08-10T00:00:00.000Z",
    },
  ]);

  assert.equal(values.length, 9);
  assert.match(sql, /::timestamptz/);
  assert.match(sql, /::integer/);
  assert.match(sql, /::bigint/);
});

test("buildBmSummarySql sinh INSERT chọn BM 30 ngày từ history theo server", () => {
  const sql = _test.buildBmSummarySql("asia");
  assert.match(sql, /INSERT INTO item_bm_30d/);
  assert.match(sql, /city = 'Black Market'/);
  assert.match(sql, /quality = 1/);
  assert.match(sql, /AVG\(avg_price\)::integer AS bm_avg_30d/);
  assert.match(sql, /quality BETWEEN 1 AND 5/);
  assert.match(sql, /SUM\(item_count\)/);
  assert.match(sql, /GROUP BY server, unique_name, enchant/);
  assert.match(sql, /\$1/);
});
