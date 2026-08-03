const itemsModel = require("../models/itemsModel");
const { parseShopFilters } = require("../utils/shopFilters");

const getAllItems = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(200, Math.max(1, parseInt(req.query.limit) || 50));
    const filters = parseShopFilters(req.query);
    const data = await itemsModel.getAllItems(page, limit, filters);
    res.json(data);
  } catch (err) {
    console.error("Lỗi getAllItems:", err.message);
    res.status(500).json({ error: "Lỗi server khi lấy danh sách items" });
  }
};

const getShopFilterOptions = async (req, res) => {
  try {
    const options = await itemsModel.getShopFilterOptions();
    res.json({ options });
  } catch (err) {
    console.error("Lỗi getShopFilterOptions:", err.message);
    res.status(500).json({ error: "Lỗi server khi lấy tùy chọn bộ lọc" });
  }
};

const getItemByUniqueName = async (req, res) => {
  try {
    const { uniqueName } = req.params;
    const item = await itemsModel.getItemByUniqueName(uniqueName);
    if (!item) {
      return res.status(404).json({ error: "Không tìm thấy item" });
    }
    res.json({ item });
  } catch (err) {
    console.error("Lỗi getItemByUniqueName:", err.message);
    res.status(500).json({ error: "Lỗi server khi lấy item" });
  }
};

module.exports = { getAllItems, getShopFilterOptions, getItemByUniqueName };