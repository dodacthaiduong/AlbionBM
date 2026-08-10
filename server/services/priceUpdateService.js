const crypto = require("node:crypto");
const pool = require("../config/db");
const { getServerConfig } = require("../config/env");

const { albionApiBaseUrls: SERVER_BASE_URLS } = getServerConfig();

const LOCATIONS = Object.freeze([
  "Caerleon",
  "Black Market",
  "Bridgewatch",
  "Martlock",
  "Lymhurst",
  "Fort Sterling",
  "Thetford",
  "Brecilien",
]);

const MAX_URL_BYTES = 4096;
const HISTORY_START_DATE = "2018-01-01";
const HISTORY_TIME_SCALE = "24";
const REQUEST_TIMEOUT_MS = 20_000;
const MAX_REQUEST_ATTEMPTS = 3;
const REQUEST_CONCURRENCY = 3;
const DATABASE_CHUNK_SIZE = 500;
const LOCK_NAMESPACE = "albionbm-price-update";

const jobs = new Map();
const latestJobIds = new Map();
const runningJobIds = new Map();

const sleep = (milliseconds) =>
  new Promise((resolve) => setTimeout(resolve, milliseconds));

const isSupportedServer = (server) =>
  Object.prototype.hasOwnProperty.call(SERVER_BASE_URLS, server);

const snapshotJob = (job) => ({
  ...job,
  errors: job.errors.map((error) => ({ ...error })),
});

const getJob = (jobId) => {
  const job = jobs.get(jobId);
  return job ? snapshotJob(job) : null;
};

const getLatestJob = (server) => {
  const jobId = latestJobIds.get(server);
  return jobId ? getJob(jobId) : null;
};

const generateItemEntries = ({ unique_name: uniqueName, max_enchant: maxEnchant }) => {
  const entries = [];

  for (let enchant = 0; enchant <= maxEnchant; enchant += 1) {
    entries.push({
      itemId: enchant === 0 ? uniqueName : `${uniqueName}@${enchant}`,
      uniqueName,
      enchant,
    });
  }

  return entries;
};

const buildPriceUrl = (baseUrl, itemIds, qualities) => {
  const encodedItemIds = itemIds.map((itemId) => encodeURIComponent(itemId)).join(",");
  const query = new URLSearchParams({
    locations: LOCATIONS.join(","),
    qualities: qualities.join(","),
  });

  return `${baseUrl}/api/v2/stats/prices/${encodedItemIds}.json?${query.toString()}`;
};

const buildHistoryUrl = (baseUrl, itemIds, qualities, startDate, endDate) => {
  const encodedItemIds = itemIds.map((itemId) => encodeURIComponent(itemId)).join(",");
  const query = new URLSearchParams({
    date: startDate,
    end_date: endDate,
    locations: LOCATIONS.join(","),
    qualities: qualities.join(","),
    "time-scale": HISTORY_TIME_SCALE,
  });
  return `${baseUrl}/api/v2/stats/history/${encodedItemIds}.json?${query.toString()}`;
};

const createBatches = (baseUrl, entries, qualities, urlBuilder = buildPriceUrl) => {
  const batches = [];
  let currentEntries = [];

  for (const entry of entries) {
    const candidateEntries = [...currentEntries, entry];
    const candidateUrl = urlBuilder(
      baseUrl,
      candidateEntries.map(({ itemId }) => itemId),
      qualities
    );

    if (Buffer.byteLength(candidateUrl, "utf8") <= MAX_URL_BYTES) {
      currentEntries = candidateEntries;
      continue;
    }

    if (currentEntries.length === 0) {
      throw new Error(`item_id tạo URL vượt quá ${MAX_URL_BYTES} byte: ${entry.itemId}`);
    }

    const currentUrl = urlBuilder(
      baseUrl,
      currentEntries.map(({ itemId }) => itemId),
      qualities
    );
    batches.push({ entries: currentEntries, qualities, url: currentUrl });

    currentEntries = [entry];
    const singleUrl = urlBuilder(baseUrl, [entry.itemId], qualities);
    if (Buffer.byteLength(singleUrl, "utf8") > MAX_URL_BYTES) {
      throw new Error(`item_id tạo URL vượt quá ${MAX_URL_BYTES} byte: ${entry.itemId}`);
    }
  }

  if (currentEntries.length > 0) {
    batches.push({
      entries: currentEntries,
      qualities,
      url: urlBuilder(
        baseUrl,
        currentEntries.map(({ itemId }) => itemId),
        qualities
      ),
    });
  }

  return batches;
};

const loadAndPrepareItems = async () => {
  const result = await pool.query(
    `SELECT unique_name, max_quality, max_enchant
     FROM items
     ORDER BY unique_name`
  );
  const qualityGroups = new Map([
    [1, []],
    [5, []],
  ]);

  for (const item of result.rows) {
    if (!item.unique_name || ![1, 5].includes(item.max_quality)) {
      throw new Error(`Item có max_quality không hợp lệ: ${item.unique_name || "(trống)"}`);
    }
    if (![0, 3, 4].includes(item.max_enchant)) {
      throw new Error(`Item có max_enchant không hợp lệ: ${item.unique_name}`);
    }

    qualityGroups.get(item.max_quality).push(...generateItemEntries(item));
  }

  return { items: result.rows, qualityGroups };
};

const getRetryDelay = (response, attempt) => {
  const retryAfter = response?.headers.get("retry-after");
  if (retryAfter) {
    const seconds = Number(retryAfter);
    if (Number.isFinite(seconds)) return Math.min(seconds * 1000, 30_000);

    const retryAt = Date.parse(retryAfter);
    if (Number.isFinite(retryAt)) return Math.min(Math.max(0, retryAt - Date.now()), 30_000);
  }

  return 1000 * 2 ** attempt + Math.floor(Math.random() * 250);
};

const fetchBatch = async (url) => {
  let lastError;

  for (let attempt = 0; attempt < MAX_REQUEST_ATTEMPTS; attempt += 1) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
    let response;

    try {
      response = await fetch(url, {
        headers: { Accept: "application/json" },
        signal: controller.signal,
      });

      if (!response.ok) {
        const error = new Error(`Albion API trả về HTTP ${response.status}`);
        error.retriable = response.status === 429 || response.status >= 500;
        throw error;
      }

      const payload = await response.json();
      if (!Array.isArray(payload)) {
        const error = new Error("Albion API trả về payload không phải mảng");
        error.retriable = true;
        throw error;
      }

      return payload;
    } catch (error) {
      lastError = error;
      const timedOut = error.name === "AbortError";
      const retriable = timedOut || error.retriable !== false;
      const hasNextAttempt = attempt + 1 < MAX_REQUEST_ATTEMPTS;

      if (!retriable || !hasNextAttempt) throw error;
      await sleep(getRetryDelay(response, attempt));
    } finally {
      clearTimeout(timeout);
    }
  }

  throw lastError;
};

const normalizeApiDate = (value) => {
  if (typeof value !== "string" || value.startsWith("0001-01-01")) return null;

  const hasTimezone = /(?:Z|[+-]\d{2}:\d{2})$/i.test(value);
  const date = new Date(hasTimezone ? value : `${value}Z`);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
};

const normalizeHistoryDate = (value) => {
  if (typeof value === "number") {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : date.toISOString();
  }
  return normalizeApiDate(value);
};

const normalizePricePair = (priceValue, dateValue) => {
  const price = Number(priceValue);
  if (!Number.isSafeInteger(price) || price <= 0) return [null, null];
  return [price, normalizeApiDate(dateValue)];
};

const mapApiRows = (payload, batch, server, fetchedAt) => {
  const entryById = new Map(batch.entries.map((entry) => [entry.itemId, entry]));
  const allowedCities = new Set(LOCATIONS);
  const allowedQualities = new Set(batch.qualities);
  const rowsByKey = new Map();

  for (const record of payload) {
    const entry = entryById.get(record?.item_id);
    const quality = Number(record?.quality);
    if (!entry || !allowedCities.has(record.city) || !allowedQualities.has(quality)) continue;

    const [sellPriceMin, sellPriceMinDate] = normalizePricePair(
      record.sell_price_min,
      record.sell_price_min_date
    );
    const [sellPriceMax, sellPriceMaxDate] = normalizePricePair(
      record.sell_price_max,
      record.sell_price_max_date
    );
    const [buyPriceMin, buyPriceMinDate] = normalizePricePair(
      record.buy_price_min,
      record.buy_price_min_date
    );
    const [buyPriceMax, buyPriceMaxDate] = normalizePricePair(
      record.buy_price_max,
      record.buy_price_max_date
    );

    const row = {
      server,
      uniqueName: entry.uniqueName,
      enchant: entry.enchant,
      city: record.city,
      quality,
      sellPriceMin,
      sellPriceMinDate,
      sellPriceMax,
      sellPriceMaxDate,
      buyPriceMin,
      buyPriceMinDate,
      buyPriceMax,
      buyPriceMaxDate,
      fetchedAt,
    };
    rowsByKey.set(
      [server, entry.uniqueName, entry.enchant, record.city, quality].join("\u0000"),
      row
    );
  }

  return [...rowsByKey.values()];
};

const mapHistoryRows = (payload, batch, server, fetchedAt) => {
  const entryById = new Map(batch.entries.map((entry) => [entry.itemId, entry]));
  const allowedCities = new Set(LOCATIONS);
  const allowedQualities = new Set(batch.qualities);
  const rows = [];

  for (const record of payload) {
    const entry = entryById.get(record?.item_id);
    const quality = Number(record?.quality);
    if (!entry || !allowedCities.has(record.location) || !allowedQualities.has(quality)) continue;

    for (const point of record.data || []) {
      const priceDate = normalizeHistoryDate(point?.timestamp);
      if (!priceDate) continue;

      const avgPrice = Number(point?.avg_price);
      const itemCount = Number(point?.item_count);

      rows.push({
        server,
        uniqueName: entry.uniqueName,
        enchant: entry.enchant,
        city: record.location,
        quality,
        priceDate,
        avgPrice: Number.isSafeInteger(avgPrice) && avgPrice > 0 ? avgPrice : null,
        itemCount: Number.isSafeInteger(itemCount) && itemCount >= 0 ? itemCount : null,
        fetchedAt,
      });
    }
  }

  return rows;
};

const DATABASE_COLUMNS = [
  "server",
  "unique_name",
  "enchant",
  "city",
  "quality",
  "sell_price_min",
  "sell_price_min_date",
  "sell_price_max",
  "sell_price_max_date",
  "buy_price_min",
  "buy_price_min_date",
  "buy_price_max",
  "buy_price_max_date",
  "fetched_at",
];

const PARAMETER_CASTS = [
  "text",
  "text",
  "smallint",
  "text",
  "smallint",
  "integer",
  "timestamptz",
  "integer",
  "timestamptz",
  "integer",
  "timestamptz",
  "integer",
  "timestamptz",
  "timestamptz",
];

const HISTORY_COLUMNS = [
  "server",
  "unique_name",
  "enchant",
  "city",
  "quality",
  "price_date",
  "avg_price",
  "item_count",
  "fetched_at",
];

const HISTORY_CASTS = [
  "text",
  "text",
  "smallint",
  "text",
  "smallint",
  "timestamptz",
  "integer",
  "bigint",
  "timestamptz",
];

const getHistoryRowValues = (row) => [
  row.server,
  row.uniqueName,
  row.enchant,
  row.city,
  row.quality,
  row.priceDate,
  row.avgPrice,
  row.itemCount,
  row.fetchedAt,
];

const buildHistoryValuesClause = (rows) => {
  const values = [];
  const groups = rows.map((row) => {
    const rowValues = getHistoryRowValues(row);
    const placeholders = rowValues.map((value, index) => {
      values.push(value);
      return `$${values.length}::${HISTORY_CASTS[index]}`;
    });
    return `(${placeholders.join(", ")})`;
  });

  return { sql: groups.join(",\n"), values };
};

const getRowValues = (row) => [
  row.server,
  row.uniqueName,
  row.enchant,
  row.city,
  row.quality,
  row.sellPriceMin,
  row.sellPriceMinDate,
  row.sellPriceMax,
  row.sellPriceMaxDate,
  row.buyPriceMin,
  row.buyPriceMinDate,
  row.buyPriceMax,
  row.buyPriceMaxDate,
  row.fetchedAt,
];

const buildValuesClause = (rows) => {
  const values = [];
  const groups = rows.map((row) => {
    const rowValues = getRowValues(row);
    const placeholders = rowValues.map((value, index) => {
      values.push(value);
      return `$${values.length}::${PARAMETER_CASTS[index]}`;
    });
    return `(${placeholders.join(", ")})`;
  });

  return { sql: groups.join(",\n"), values };
};

const persistChunk = async (client, rows) => {
  const valueList = buildValuesClause(rows);
  const inputColumns = DATABASE_COLUMNS.join(", ");
  const comparedColumns = [
    "sell_price_min",
    "sell_price_min_date",
    "sell_price_max",
    "sell_price_max_date",
    "buy_price_min",
    "buy_price_min_date",
    "buy_price_max",
    "buy_price_max_date",
  ];
  const updateAssignments = [...comparedColumns, "fetched_at"]
    .map((column) => `${column} = EXCLUDED.${column}`)
    .join(",\n         ");
  const currentResult = await client.query(
    `INSERT INTO item_prices_current (${inputColumns})
     VALUES ${valueList.sql}
     ON CONFLICT (server, unique_name, enchant, city, quality)
     DO UPDATE SET ${updateAssignments}`,
    valueList.values
  );

  return { currentRows: currentResult.rowCount };
};

const persistRows = async (rows) => {
  if (rows.length === 0) return { currentRows: 0 };

  const client = await pool.connect();
  let currentRows = 0;

  try {
    await client.query("BEGIN");
    for (let index = 0; index < rows.length; index += DATABASE_CHUNK_SIZE) {
      const result = await persistChunk(client, rows.slice(index, index + DATABASE_CHUNK_SIZE));
      currentRows += result.currentRows;
    }
    await client.query("COMMIT");
    return { currentRows };
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
};

const persistHistoryChunk = async (client, rows) => {
  if (rows.length === 0) return 0;

  const { sql, values } = buildHistoryValuesClause(rows);
  const columns = HISTORY_COLUMNS.join(", ");
  const result = await client.query(
    `INSERT INTO item_price_history (${columns})
     VALUES ${sql}
     ON CONFLICT (server, unique_name, enchant, city, quality, price_date)
     DO UPDATE SET avg_price = EXCLUDED.avg_price,
                   item_count = EXCLUDED.item_count,
                   fetched_at = EXCLUDED.fetched_at`,
    values
  );

  return result.rowCount;
};

const persistHistoryRows = async (rows) => {
  if (rows.length === 0) return 0;

  const client = await pool.connect();
  let count = 0;

  try {
    await client.query("BEGIN");
    for (let index = 0; index < rows.length; index += DATABASE_CHUNK_SIZE) {
      count += await persistHistoryChunk(client, rows.slice(index, index + DATABASE_CHUNK_SIZE));
    }
    await client.query("COMMIT");
    return count;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
};

const processWithConcurrency = async (batches, concurrency, handler) => {
  let nextIndex = 0;

  const worker = async () => {
    while (nextIndex < batches.length) {
      const index = nextIndex;
      nextIndex += 1;
      await handler(batches[index], index);
    }
  };

  const workerCount = Math.min(concurrency, batches.length);
  await Promise.all(Array.from({ length: workerCount }, worker));
};

const runHistoryPhase = async (job, qualityGroups, baseUrl) => {
  const endDate = new Date().toISOString().slice(0, 10);
  const urlBuilder = (urlBase, itemIds, qualities) =>
    buildHistoryUrl(urlBase, itemIds, qualities, HISTORY_START_DATE, endDate);
  const batches = [
    ...createBatches(baseUrl, qualityGroups.get(1), [1], urlBuilder),
    ...createBatches(baseUrl, qualityGroups.get(5), [1, 2, 3, 4, 5], urlBuilder),
  ];

  await processWithConcurrency(batches, REQUEST_CONCURRENCY, async (batch, index) => {
    try {
      const payload = await fetchBatch(batch.url);
      const rows = mapHistoryRows(payload, batch, job.server, new Date().toISOString());
      const count = await persistHistoryRows(rows);
      job.history_rows += count;
    } catch (error) {
      job.failed_batches += 1;
      job.errors.push({ batch: index + 1, message: error.message });
      console.error(
        `[price-update:${job.id}] History batch ${index + 1}/${batches.length} thất bại:`,
        error.message
      );
    } finally {
      job.completed_batches += 1;
    }
  });
};

const runPriceUpdate = async (job, lockClient) => {
  try {
    job.status = "running";
    job.started_at = new Date().toISOString();

    const { items, qualityGroups } = await loadAndPrepareItems();
    const baseUrl = SERVER_BASE_URLS[job.server];

    const currentBatches = [
      ...createBatches(baseUrl, qualityGroups.get(1), [1]),
      ...createBatches(baseUrl, qualityGroups.get(5), [1, 2, 3, 4, 5]),
    ];

    const endDate = new Date().toISOString().slice(0, 10);
    const historyUrlBuilder = (urlBase, itemIds, qualities) =>
      buildHistoryUrl(urlBase, itemIds, qualities, HISTORY_START_DATE, endDate);
    const historyBatches = [
      ...createBatches(baseUrl, qualityGroups.get(1), [1], historyUrlBuilder),
      ...createBatches(baseUrl, qualityGroups.get(5), [1, 2, 3, 4, 5], historyUrlBuilder),
    ];

    job.total_items = items.length;
    job.total_item_ids = qualityGroups.get(1).length + qualityGroups.get(5).length;
    job.total_batches = currentBatches.length + historyBatches.length;
    job.max_url_bytes = Math.max(
      ...currentBatches.map((batch) => Buffer.byteLength(batch.url, "utf8")),
      ...historyBatches.map((batch) => Buffer.byteLength(batch.url, "utf8"))
    );

    await processWithConcurrency(currentBatches, REQUEST_CONCURRENCY, async (batch, index) => {
      try {
        const payload = await fetchBatch(batch.url);
        const rows = mapApiRows(payload, batch, job.server, new Date().toISOString());
        const result = await persistRows(rows);
        job.current_rows += result.currentRows;
      } catch (error) {
        job.failed_batches += 1;
        job.errors.push({ batch: index + 1, message: error.message });
        console.error(
          `[price-update:${job.id}] Batch ${index + 1}/${currentBatches.length} thất bại:`,
          error.message
        );
      } finally {
        job.completed_batches += 1;
      }
    });

    await runHistoryPhase(job, qualityGroups, baseUrl);

    job.status = job.failed_batches > 0 ? "completed_with_errors" : "completed";
  } catch (error) {
    job.status = "failed";
    job.error_message = error.message;
    console.error(`[price-update:${job.id}] Job thất bại:`, error);
  } finally {
    job.finished_at = new Date().toISOString();
    runningJobIds.delete(job.server);

    try {
      await lockClient.query("SELECT pg_advisory_unlock(hashtext($1), hashtext($2))", [
        LOCK_NAMESPACE,
        job.server,
      ]);
    } catch (error) {
      console.error(`[price-update:${job.id}] Không thể mở advisory lock:`, error.message);
    } finally {
      lockClient.release();
    }
  }
};

const startPriceUpdate = async (server = "asia") => {
  if (!isSupportedServer(server)) {
    throw new Error(`Server không được hỗ trợ: ${server}`);
  }

  const runningJobId = runningJobIds.get(server);
  if (runningJobId) {
    const error = new Error(`Đang có job cập nhật giá cho server ${server}.`);
    error.code = "PRICE_UPDATE_ALREADY_RUNNING";
    error.job = getJob(runningJobId);
    throw error;
  }

  const lockClient = await pool.connect();
  let acquired = false;

  try {
    const lockResult = await lockClient.query(
      "SELECT pg_try_advisory_lock(hashtext($1), hashtext($2)) AS acquired",
      [LOCK_NAMESPACE, server]
    );
    acquired = lockResult.rows[0].acquired;
  } catch (error) {
    lockClient.release();
    throw error;
  }

  if (!acquired) {
    lockClient.release();
    const error = new Error(`Đang có tiến trình khác cập nhật giá cho server ${server}.`);
    error.code = "PRICE_UPDATE_ALREADY_RUNNING";
    throw error;
  }

  const job = {
    id: crypto.randomUUID(),
    server,
    status: "queued",
    total_items: 0,
    total_item_ids: 0,
    total_batches: 0,
    completed_batches: 0,
    failed_batches: 0,
    current_rows: 0,
    history_rows: 0,
    max_url_bytes: 0,
    errors: [],
    error_message: null,
    created_at: new Date().toISOString(),
    started_at: null,
    finished_at: null,
  };

  jobs.set(job.id, job);
  latestJobIds.set(server, job.id);
  runningJobIds.set(server, job.id);

  setImmediate(() => {
    void runPriceUpdate(job, lockClient);
  });

  return snapshotJob(job);
};

module.exports = {
  getJob,
  getLatestJob,
  isSupportedServer,
  startPriceUpdate,
  _test: {
    MAX_URL_BYTES,
    SERVER_BASE_URLS,
    buildPriceUrl,
    buildHistoryUrl,
    HISTORY_START_DATE,
    HISTORY_TIME_SCALE,
    createBatches,
    generateItemEntries,
    mapApiRows,
    mapHistoryRows,
    normalizeHistoryDate,
    persistChunk,
    buildHistoryValuesClause,
  },
};
