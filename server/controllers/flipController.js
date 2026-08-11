const priceUpdateService = require("../routes/services/priceUpdateService");
const pricesModel = require("../models/pricesModel");
const { computeFlipOpportunities } = require("../routes/services/flipService");
const { parseShopFilters } = require("../utils/shopFilters");

const parseIntegerFilter = (value, { min, max } = {}) => {
  if (typeof value !== "string" || value.trim() === "") return null;
  const parsedValue = Number(value);
  if (!Number.isInteger(parsedValue)) return null;
  if (min !== undefined && parsedValue < min) return null;
  if (max !== undefined && parsedValue > max) return null;
  return parsedValue;
};

const parseIntegerMulti = (value, { min, max } = {}) => {
  if (typeof value !== "string") return [];
  return value
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean)
    .filter((part) => {
      if (!/^\d+$/.test(part)) return false;
      const parsed = Number(part);
      if (min !== undefined && parsed < min) return false;
      if (max !== undefined && parsed > max) return false;
      return true;
    });
};

const parseEnchantFilter = (value) => parseIntegerMulti(value, { min: 0, max: 4 }).join(",");
const parseTierFilter = (value) => parseIntegerMulti(value, { min: 1, max: 8 }).join(",");
const parseQualityFilter = (value) => parseIntegerMulti(value, { min: 1, max: 5 }).join(",");

const getFlipOpportunities = async (req, res) => {
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
    const [standardRows, upgradeRows] = await Promise.all([
      pricesModel.getFlipRows({
        server,
        filters: parseShopFilters(req.query),
        tier: parseTierFilter(req.query.tier),
        enchant: parseEnchantFilter(req.query.enchant),
        quality: parseQualityFilter(req.query.quality),
      }),
      pricesModel.getUpgradeFlipRows({
        server,
        filters: parseShopFilters(req.query),
        tier: parseTierFilter(req.query.tier),
        enchant: parseEnchantFilter(req.query.enchant),
        quality: parseQualityFilter(req.query.quality),
      }),
    ]);
    const combinedRows = [...standardRows, ...upgradeRows];
    const opportunities = computeFlipOpportunities(combinedRows, {
      minProfitPercent: parseIntegerFilter(req.query.minProfitPercent, { min: 0 }) ?? 0,
    });

    const sortBy = req.query.sort === "profit_percent" ? "profit_percent" : "profit";
    opportunities.sort((a, b) => b[sortBy] - a[sortBy]);

    const offset = (page - 1) * limit;
    const paged = opportunities.slice(offset, offset + limit);

    return res.json({
      opportunities: paged,
      total: opportunities.length,
      page,
      limit,
      totalPages: Math.ceil(opportunities.length / limit),
    });
  } catch (error) {
    console.error("Lỗi getFlipOpportunities:", error);
    return res.status(500).json({ error: "Không thể tính cơ hội flip." });
  }
};

module.exports = { getFlipOpportunities, _test: { parseIntegerMulti, parseTierFilter, parseEnchantFilter, parseQualityFilter } };
