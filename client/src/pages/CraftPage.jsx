import { useEffect, useState } from "react";
import PriceUpdatePanel from "../components/PriceUpdatePanel";
import ShopFilters from "../components/ShopFilters";
import MultiSelectDropdown from "../components/MultiSelectDropdown";
import {
  SHOP_FILTER_FIELDS,
  createEmptyShopFilters,
  hasActiveShopFilters,
  valueToArray,
} from "../utils/shopFilters";
import { getCraftOpportunities, getShopFilterOptions } from "../services/api";
import { getErrorMessage } from "../utils/errors.js";

const PAGE_SIZE = 50;
const ENCHANT_OPTIONS = [0, 1, 2, 3, 4];
const TIER_OPTIONS = [1, 2, 3, 4, 5, 6, 7, 8];

const formatPrice = (price) =>
  price === null || price === undefined
    ? "—"
    : new Intl.NumberFormat("en-US").format(price);

const formatCount = (count) =>
  count === null || count === undefined
    ? "—"
    : new Intl.NumberFormat("en-US", { maximumFractionDigits: 1 }).format(count);

export default function CraftPage() {
  const [server, setServer] = useState("asia");
  const [opportunities, setOpportunities] = useState([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filters, setFilters] = useState(createEmptyShopFilters);
  const [tierFilter, setTierFilter] = useState("");
  const [enchantFilter, setEnchantFilter] = useState("");
  const [sortBy, setSortBy] = useState("profit_percent");
  const [minProfitPercent, setMinProfitPercent] = useState("");
  const [filterOptions, setFilterOptions] = useState([]);
  const [filterLabels, setFilterLabels] = useState({});
  const [filterError, setFilterError] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let active = true;
    getShopFilterOptions()
      .then((data) => {
        if (active) {
          setFilterOptions(data.options);
          setFilterLabels(data.labels || {});
        }
      })
      .catch((requestError) => {
        if (active) setFilterError(requestError.message);
      });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    let active = true;
    setLoading(true);

    getCraftOpportunities(page, PAGE_SIZE, server, {
      ...filters,
      tier: tierFilter,
      enchant: enchantFilter,
      sort: sortBy,
      minProfitPercent,
    })
      .then((data) => {
        if (!active) return;
        setOpportunities(data.data);
        setTotal(data.total);
        setTotalPages(data.totalPages);
        setLoading(false);
        setError("");
      })
      .catch((requestError) => {
        if (!active) return;
        setError(getErrorMessage(requestError));
        setLoading(false);
      });

    return () => { active = false; };
  }, [page, server, filters, tierFilter, enchantFilter, sortBy, minProfitPercent, refreshKey]);

  const beginReload = () => {
    setLoading(true);
    setError("");
  };

  const reload = () => {
    beginReload();
    setRefreshKey((key) => key + 1);
  };

  const changePage = (nextPage) => {
    beginReload();
    setPage(nextPage);
  };

  const handleFilterChange = (index, value) => {
    beginReload();
    setFilters((current) => {
      const next = { ...current, [SHOP_FILTER_FIELDS[index].key]: value };
      SHOP_FILTER_FIELDS.slice(index + 1).forEach(({ key }) => { next[key] = ""; });
      return next;
    });
    setPage(1);
  };

  const clearFilters = () => {
    beginReload();
    setFilters(createEmptyShopFilters());
    setTierFilter("");
    setEnchantFilter("");
    setMinProfitPercent("");
    setPage(1);
  };

  const handleServerChange = (value) => {
    beginReload();
    setServer(value);
    setPage(1);
  };

  const hasActiveFilters =
    hasActiveShopFilters(filters) ||
    valueToArray(tierFilter).length > 0 ||
    valueToArray(enchantFilter).length > 0 ||
    minProfitPercent !== "";

  const pagination = (
    <div className="d-flex flex-wrap gap-2 align-items-center">
      <button className="btn btn-outline-secondary btn-sm" disabled={page <= 1 || loading} onClick={() => changePage(1)}>««</button>
      <button className="btn btn-outline-secondary btn-sm" disabled={page <= 1 || loading} onClick={() => changePage(page - 1)}>« Trước</button>
      <span className="mx-1">Trang {totalPages === 0 ? 0 : page} / {totalPages}</span>
      <button className="btn btn-outline-secondary btn-sm" disabled={page >= totalPages || loading} onClick={() => changePage(page + 1)}>Sau »</button>
      <button className="btn btn-outline-secondary btn-sm" disabled={page >= totalPages || loading} onClick={() => changePage(totalPages)}>»»</button>
      <button className="btn btn-outline-primary btn-sm ms-1" disabled={loading} onClick={reload}>Tải lại</button>
    </div>
  );

  return (
    <div>
      <div className="mb-4">
        <PriceUpdatePanel server={server} onServerChange={handleServerChange} onUpdateFinished={reload} />
      </div>

      <div className="d-flex flex-wrap justify-content-between align-items-center mb-3 gap-2">
        <h2 className="h4 mb-0">
          Craft — {server.toUpperCase()} ({total})
        </h2>
        <div className="d-flex align-items-center gap-2">
          <label className="form-label mb-0 fw-semibold">Sắp xếp:</label>
          <div className="btn-group btn-group-sm">
            <button type="button" className={`btn ${sortBy === "profit" ? "btn-primary" : "btn-outline-primary"}`} onClick={() => { beginReload(); setSortBy("profit"); setPage(1); }}>
              Lãi (số tiền)
            </button>
            <button type="button" className={`btn ${sortBy === "profit_percent" ? "btn-primary" : "btn-outline-primary"}`} onClick={() => { beginReload(); setSortBy("profit_percent"); setPage(1); }}>
              Lãi %
            </button>
          </div>
        </div>
      </div>

      {error && <div className="alert alert-danger">Lỗi: {error}</div>}

      <ShopFilters
        filters={filters}
        filterOptions={filterOptions}
        filterLabels={filterLabels}
        onFilterChange={handleFilterChange}
        onClearFilters={clearFilters}
        hasActiveFilters={hasActiveFilters}
      >
        <div className="col-auto">
          <label className="form-label fw-semibold mb-1">Tier</label>
          <MultiSelectDropdown
            value={tierFilter}
            onChange={(csvValue) => { beginReload(); setTierFilter(csvValue); setPage(1); }}
            options={TIER_OPTIONS.map(String)}
          />
        </div>
        <div className="col-auto">
          <label className="form-label fw-semibold mb-1">Enchant</label>
          <MultiSelectDropdown
            value={enchantFilter}
            onChange={(csvValue) => { beginReload(); setEnchantFilter(csvValue); setPage(1); }}
            options={ENCHANT_OPTIONS.map(String)}
          />
        </div>
        <div className="col-auto">
          <label className="form-label fw-semibold mb-1">% lãi ≥</label>
          <input
            type="number"
            className="form-control"
            min="0"
            step="1"
            placeholder="VD: 10"
            value={minProfitPercent}
            onChange={(event) => { beginReload(); setMinProfitPercent(event.target.value); setPage(1); }}
          />
        </div>
      </ShopFilters>

      {filterError && <div className="alert alert-danger">Không thể tải tùy chọn bộ lọc: {filterError}</div>}

      <div className="mb-3">{pagination}</div>

      <div className="card shadow-sm border-0">
        <div className="table-responsive">
          <table className="table table-hover table-striped align-middle small mb-0">
            <thead className="table-light">
              <tr>
                <th>Item</th>
                <th>Enchant</th>
                <th>Nguyên liệu / 40 cái</th>
                <th>Giá nguyên liệu</th>
                <th>Giá BM</th>
                <th>Lãi (sau 6.5% thuế)</th>
                <th>Lãi %</th>
                <th>SL bán TB/ngày</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="8" className="text-center text-body-secondary py-4">
                    Đang tính lợi nhuận craft...
                  </td>
                </tr>
              ) : opportunities.length === 0 ? (
                <tr>
                  <td colSpan="8" className="text-center text-body-secondary py-4">
                    {hasActiveFilters
                      ? "Không có cơ hội craft phù hợp với bộ lọc hiện tại."
                      : "Chưa có dữ liệu craft cho server này. Hãy cập nhật giá trước."}
                  </td>
                </tr>
              ) : (
                opportunities.map((opp) => (
                  <tr key={`${opp.unique_name}-${opp.enchant_level}`}>
                    <td>
                      <strong>{opp.english_name || opp.unique_name}</strong>
                      <div className="text-body-secondary" style={{ fontSize: "11px" }}>
                        {opp.unique_name}
                      </div>
                    </td>
                    <td>{opp.enchant_level}</td>
                    <td>
                      <div style={{ fontSize: "11px" }}>
                        {opp.materials.map((mat) => (
                          <div key={mat.material_unique_name}>
                            {mat.material_name}: {mat.count * 40} × {formatPrice(mat.price)} = {formatPrice(mat.count * 40 * mat.price)}
                            <span className="text-body-secondary"> dùng {mat.count * 40 - Math.floor(mat.count * 40 * 0.248)} (hoàn {Math.floor(mat.count * 40 * 0.248)})</span>
                          </div>
                        ))}
                      </div>
                    </td>
                    <td>
                      <div className="fw-semibold">{formatPrice(opp.total_material_cost)}</div>
                      <div className="text-body-secondary" style={{ fontSize: "11px" }}>
                        Bạc craft: {formatPrice(opp.silver_cost)}
                      </div>
                      <div className="text-body-secondary" style={{ fontSize: "11px" }}>
                        Tổng: {formatPrice(opp.total_cost)}
                      </div>
                    </td>
                    <td>{formatPrice(opp.effective_sell_price)}</td>
                    <td className="fw-semibold">{formatPrice(opp.profit)}</td>
                    <td>
                      <span className={`badge ${opp.profit >= 0 ? "text-bg-success" : "text-bg-danger"}`}>
                        {opp.profit_percent}%
                      </span>
                    </td>
                    <td>{formatCount(opp.bm_sold_30d)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="mt-3">{pagination}</div>
    </div>
  );
}
