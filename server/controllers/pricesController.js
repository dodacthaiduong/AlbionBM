const priceUpdateService = require("../services/priceUpdateService");
const pricesModel = require("../models/pricesModel");
const { parseShopFilters } = require("../utils/shopFilters");

const getRequestedServer = (req) =>
  typeof req.body?.server === "string" ? req.body.server.trim().toLowerCase() : "asia";

const startUpdateAll = async (req, res) => {
  const server = getRequestedServer(req);

  if (!priceUpdateService.isSupportedServer(server)) {
    return res.status(400).json({
      error: "Server không hợp lệ. Chỉ chấp nhận asia, america hoặc europe.",
    });
  }

  try {
    const job = await priceUpdateService.startPriceUpdate(server);
    return res.status(202).json({ job });
  } catch (error) {
    if (error.code === "PRICE_UPDATE_ALREADY_RUNNING") {
      return res.status(409).json({ error: error.message, job: error.job || null });
    }

    console.error("Lỗi startUpdateAll:", error);
    return res.status(500).json({ error: "Không thể bắt đầu cập nhật giá." });
  }
};

const getUpdateStatus = (req, res) => {
  const job = priceUpdateService.getJob(req.params.jobId);

  if (!job) {
    return res.status(404).json({ error: "Không tìm thấy job cập nhật giá." });
  }

  return res.json({ job });
};

const getLatestUpdate = (req, res) => {
  const server =
    typeof req.query.server === "string" ? req.query.server.trim().toLowerCase() : "asia";

  if (!priceUpdateService.isSupportedServer(server)) {
    return res.status(400).json({
      error: "Server không hợp lệ. Chỉ chấp nhận asia, america hoặc europe.",
    });
  }

  return res.json({ job: priceUpdateService.getLatestJob(server) });
};

const parseIntegerFilter = (value, { min, max } = {}) => {
  if (typeof value !== "string" || value.trim() === "") return null;

  const parsedValue = Number(value);
  if (!Number.isInteger(parsedValue)) return null;
  if (min !== undefined && parsedValue < min) return null;
  if (max !== undefined && parsedValue > max) return null;

  return parsedValue;
};

const parseEnchantFilter = (value) => parseIntegerFilter(value, { min: 0, max: 4 });
const parseTierFilter = (value) => parseIntegerFilter(value, { min: 1, max: 8 });
const parseQualityFilter = (value) => parseIntegerFilter(value, { min: 1, max: 5 });

const ALLOWED_CITY_FILTERS = new Set([
  "Caerleon",
  "Black Market",
  "Bridgewatch",
  "Martlock",
  "Lymhurst",
  "Fort Sterling",
  "Thetford",
  "Brecilien",
]);

const parseCityFilter = (value) => {
  if (typeof value !== "string" || value.trim() === "") return null;

  const city = value.trim();
  return ALLOWED_CITY_FILTERS.has(city) ? city : null;
};

const getCurrentPrices = async (req, res) => {
  const server =
    typeof req.query.server === "string" ? req.query.server.trim().toLowerCase() : "asia";

  if (!priceUpdateService.isSupportedServer(server)) {
    return res.status(400).json({
      error: "Server không hợp lệ. Chỉ chấp nhận asia, america hoặc europe.",
    });
  }

  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  const limit = Math.min(200, Math.max(1, parseInt(req.query.limit, 10) || 50));

  try {
    const filters = parseShopFilters(req.query);
    const enchant = parseEnchantFilter(req.query.enchant);
    const tier = parseTierFilter(req.query.tier);
    const city = parseCityFilter(req.query.city);
    const quality = parseQualityFilter(req.query.quality);
    const data = await pricesModel.getCurrentPrices({
      server,
      page,
      limit,
      filters,
      enchant,
      tier,
      city,
      quality,
    });
    return res.json(data);
  } catch (error) {
    console.error("Lỗi getCurrentPrices:", error);
    return res.status(500).json({ error: "Không thể lấy danh sách giá hiện tại." });
  }
};

module.exports = { startUpdateAll, getUpdateStatus, getLatestUpdate, getCurrentPrices };
