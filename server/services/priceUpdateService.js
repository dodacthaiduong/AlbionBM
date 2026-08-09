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

const createBatches = (baseUrl, entries, qualities) => {
  const batches = [];
  let currentEntries = [];

  for (const entry of entries) {
    const candidateEntries = [...currentEntries, entry];
    const candidateUrl = buildPriceUrl(
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

    const currentUrl = buildPriceUrl(
      baseUrl,
      currentEntries.map(({ itemId }) => itemId),
      qualities
    );
    batches.push({ entries: currentEntries, qualities, url: currentUrl });

    currentEntries = [entry];
    const singleUrl = buildPriceUrl(baseUrl, [entry.itemId], qualities);
    if (Buffer.byteLength(singleUrl, "utf8") > MAX_URL_BYTES) {
      throw new Error(`item_id tạo URL vượt quá ${MAX_URL_BYTES} byte: ${entry.itemId}`);
    }
  }

  if (currentEntries.length > 0) {
    batches.push({
      entries: currentEntries,
      qualities,
      url: buildPriceUrl(
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
  const currentCompared = comparedColumns.map((column) => `current.${column}`).join(", ");
  const inputCompared = comparedColumns.map((column) => `input.${column}`).join(", ");

  const historyResult = await client.query(
    `INSERT INTO item_price_history (${inputColumns})
     SELECT ${DATABASE_COLUMNS.map((column) => `input.${column}`).join(", ")}
     FROM (VALUES ${valueList.sql}) AS input (${inputColumns})
     LEFT JOIN item_prices_current AS current
       ON current.server = input.server
      AND current.unique_name = input.unique_name
      AND current.enchant = input.enchant
      AND current.city = input.city
      AND current.quality = input.quality
     WHERE current.unique_name IS NULL
        OR ROW(${currentCompared}) IS DISTINCT FROM ROW(${inputCompared})
     RETURNING id`,
    valueList.values
  );

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

  return {
    currentRows: currentResult.rowCount,
    historyRows: historyResult.rowCount,
  };
};

const persistRows = async (rows) => {
  if (rows.length === 0) return { currentRows: 0, historyRows: 0 };

  const client = await pool.connect();
  let currentRows = 0;
  let historyRows = 0;

  try {
    await client.query("BEGIN");
    for (let index = 0; index < rows.length; index += DATABASE_CHUNK_SIZE) {
      const result = await persistChunk(client, rows.slice(index, index + DATABASE_CHUNK_SIZE));
      currentRows += result.currentRows;
      historyRows += result.historyRows;
    }
    await client.query("COMMIT");
    return { currentRows, historyRows };
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

const runPriceUpdate = async (job, lockClient) => {
  try {
    job.status = "running";
    job.started_at = new Date().toISOString();

    const { items, qualityGroups } = await loadAndPrepareItems();
    const baseUrl = SERVER_BASE_URLS[job.server];
    const batches = [
      ...createBatches(baseUrl, qualityGroups.get(1), [1]),
      ...createBatches(baseUrl, qualityGroups.get(5), [1, 2, 3, 4, 5]),
    ];

    job.total_items = items.length;
    job.total_item_ids = qualityGroups.get(1).length + qualityGroups.get(5).length;
    job.total_batches = batches.length;
    job.max_url_bytes = batches.reduce(
      (maximum, batch) => Math.max(maximum, Buffer.byteLength(batch.url, "utf8")),
      0
    );

    await processWithConcurrency(batches, REQUEST_CONCURRENCY, async (batch, index) => {
      try {
        const payload = await fetchBatch(batch.url);
        const rows = mapApiRows(payload, batch, job.server, new Date().toISOString());
        const result = await persistRows(rows);
        job.current_rows += result.currentRows;
        job.history_rows += result.historyRows;
      } catch (error) {
        job.failed_batches += 1;
        job.errors.push({ batch: index + 1, message: error.message });
        console.error(
          `[price-update:${job.id}] Batch ${index + 1}/${batches.length} thất bại:`,
          error.message
        );
      } finally {
        job.completed_batches += 1;
      }
    });

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
    createBatches,
    generateItemEntries,
    mapApiRows,
    persistChunk,
  },
};
