const priceUpdateService = require("../services/priceUpdateService");
const pricesModel = require("../models/pricesModel");
const { computeFlipOpportunities } = require("../services/flipService");
const { parseShopFilters } = require("../utils/shopFilters");

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
    const rows = await pricesModel.getFlipRows({
      server,
      filters: parseShopFilters(req.query),
      tier: parseTierFilter(req.query.tier),
      enchant: parseEnchantFilter(req.query.enchant),
      quality: parseQualityFilter(req.query.quality),
    });
    const opportunities = computeFlipOpportunities(rows);

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

module.exports = { getFlipOpportunities };
