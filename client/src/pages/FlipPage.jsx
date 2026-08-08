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
import { getFlipOpportunities, getShopFilterOptions } from "../services/api";

const PAGE_SIZE = 50;
const QUALITY_LABELS = {
  1: "Normal",
  2: "Good",
  3: "Outstanding",
  4: "Excellent",
  5: "Masterpiece",
};
const ENCHANT_OPTIONS = [0, 1, 2, 3, 4];
const TIER_OPTIONS = [1, 2, 3, 4, 5, 6, 7, 8];
const QUALITY_OPTIONS = [1, 2, 3, 4, 5];

const formatPrice = (price) =>
  price === null || price === undefined
    ? "—"
    : new Intl.NumberFormat("en-US").format(price);

const formatDate = (date) => {
  if (!date) return "—";
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return "—";
  return parsed.toLocaleString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
};

export default function FlipPage() {
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
  const [qualityFilter, setQualityFilter] = useState("");
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

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let active = true;

    getFlipOpportunities(page, PAGE_SIZE, server, {
      ...filters,
      tier: tierFilter,
      enchant: enchantFilter,
      quality: qualityFilter,
      sort: sortBy,
      minProfitPercent,
    })
      .then((data) => {
        if (!active) return;
        setOpportunities(data.opportunities);
        setTotal(data.total);
        setTotalPages(data.totalPages);
        setLoading(false);
        setError("");
      })
      .catch((requestError) => {
        if (!active) return;
        setError(requestError.response?.data?.error || requestError.message);
        setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [page, server, filters, tierFilter, enchantFilter, qualityFilter, sortBy, minProfitPercent, refreshKey]);

  const beginReload = () => {
    setLoading(true);
    setError("");
  };

  const reloadOpportunities = () => {
    beginReload();
    setRefreshKey((key) => key + 1);
  };

  const changePage = (nextPage) => {
    beginReload();
    setPage(nextPage);
  };

  const handleFilterChange = (index, value) => {
    beginReload();
    setFilters((currentFilters) => {
      const nextFilters = {
        ...currentFilters,
        [SHOP_FILTER_FIELDS[index].key]: value,
      };

      SHOP_FILTER_FIELDS.slice(index + 1).forEach(({ key }) => {
        nextFilters[key] = "";
      });

      return nextFilters;
    });
    setPage(1);
  };

  const clearFilters = () => {
    beginReload();
    setFilters(createEmptyShopFilters());
    setTierFilter("");
    setEnchantFilter("");
    setQualityFilter("");
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
    valueToArray(qualityFilter).length > 0 ||
    minProfitPercent !== "";

  const pagination = (
    <div className="d-flex flex-wrap gap-2 align-items-center">
      <button className="btn btn-outline-secondary btn-sm" disabled={page <= 1 || loading} onClick={() => changePage(1)}>
        ««
      </button>
      <button className="btn btn-outline-secondary btn-sm" disabled={page <= 1 || loading} onClick={() => changePage(page - 1)}>
        « Trước
      </button>
      <span className="mx-1">
        Trang {totalPages === 0 ? 0 : page} / {totalPages}
      </span>
      <button
        className="btn btn-outline-secondary btn-sm"
        disabled={page >= totalPages || loading}
        onClick={() => changePage(page + 1)}
      >
        Sau »
      </button>
      <button
        className="btn btn-outline-secondary btn-sm"
        disabled={page >= totalPages || loading}
        onClick={() => changePage(totalPages)}
      >
        »»
      </button>
      <button className="btn btn-outline-primary btn-sm ms-1" disabled={loading} onClick={reloadOpportunities}>
        Tải lại
      </button>
    </div>
  );

  return (
    <div>
      <div className="mb-4">
        <PriceUpdatePanel
          server={server}
          onServerChange={handleServerChange}
          onUpdateFinished={reloadOpportunities}
        />
      </div>

      <div className="d-flex flex-wrap justify-content-between align-items-center mb-3 gap-2">
        <h2 className="h4 mb-0">
          Cơ hội flip — {server.toUpperCase()} ({total})
        </h2>
        <div className="d-flex align-items-center gap-2">
          <label className="form-label mb-0 fw-semibold">Sắp xếp:</label>
          <div className="btn-group btn-group-sm" role="group" aria-label="Sắp xếp">
            <button
              type="button"
              className={`btn ${sortBy === "profit" ? "btn-primary" : "btn-outline-primary"}`}
              onClick={() => {
                beginReload();
                setSortBy("profit");
                setPage(1);
              }}
            >
              Lãi (số tiền)
            </button>
            <button
              type="button"
              className={`btn ${sortBy === "profit_percent" ? "btn-primary" : "btn-outline-primary"}`}
              onClick={() => {
                beginReload();
                setSortBy("profit_percent");
                setPage(1);
              }}
            >
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
            onChange={(csvValue) => {
              beginReload();
              setTierFilter(csvValue);
              setPage(1);
            }}
            options={TIER_OPTIONS.map(String)}
          />
        </div>
        <div className="col-auto">
          <label className="form-label fw-semibold mb-1">Enchant</label>
          <MultiSelectDropdown
            value={enchantFilter}
            onChange={(csvValue) => {
              beginReload();
              setEnchantFilter(csvValue);
              setPage(1);
            }}
            options={ENCHANT_OPTIONS.map(String)}
          />
        </div>
        <div className="col-auto">
          <label className="form-label fw-semibold mb-1">Quality</label>
          <MultiSelectDropdown
            value={qualityFilter}
            onChange={(csvValue) => {
              beginReload();
              setQualityFilter(csvValue);
              setPage(1);
            }}
            options={QUALITY_OPTIONS.map(String)}
            getLabel={(quality) => QUALITY_LABELS[Number(quality)] || quality}
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
            onChange={(event) => {
              beginReload();
              setMinProfitPercent(event.target.value);
              setPage(1);
            }}
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
                <th>Quality</th>
                <th>Thành mua</th>
                <th>Giá mua</th>
                <th>Giá black market thu mua</th>
                <th>Lãi (đã trừ 6.5% thuế sell order)</th>
                <th>Lời %</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="8" className="text-center text-body-secondary py-4">
                    Đang tính cơ hội flip...
                  </td>
                </tr>
              ) : opportunities.length === 0 ? (
                <tr>
                  <td colSpan="8" className="text-center text-body-secondary py-4">
                    {hasActiveFilters
                      ? "Không có cơ hội flip phù hợp với bộ lọc hiện tại."
                      : "Chưa có cơ hội flip cho server này. Hãy cập nhật giá trước."}
                  </td>
                </tr>
              ) : (
                opportunities.map((opportunity) => (
                  <tr
                    key={`${opportunity.unique_name}-${opportunity.enchant}-${opportunity.quality}-${opportunity.buy_city}-${opportunity.sell_city}-${opportunity.is_upgrade ? `upgrade-${opportunity.base_enchant}` : "direct"}`}
                  >
                    <td>
                      <strong>{opportunity.english_name || opportunity.unique_name}</strong>
                      <div className="text-body-secondary" style={{ fontSize: "11px" }}>
                        {opportunity.unique_name}
                      </div>
                    </td>
                    <td>
                      {opportunity.enchant}
                      {opportunity.is_upgrade && (
                        <div className="text-info fw-semibold" style={{ fontSize: "11px" }}>
                          Nâng từ .{opportunity.base_enchant}
                        </div>
                      )}
                    </td>
                    <td>{QUALITY_LABELS[opportunity.quality] || opportunity.quality}</td>
                    <td>{opportunity.buy_city}</td>
                    <td>
                      <div>{formatPrice(opportunity.buy_price)}</div>
                      {opportunity.is_upgrade ? (
                        <div className="text-info" style={{ fontSize: "10px" }}>
                          Gốc: {formatPrice(opportunity.base_item_price)}
                          {opportunity.materials.map((material) => (
                            <div key={material.type}>
                              + {material.count}x {material.type === "RUNE" ? "Rune" : material.type === "SOUL" ? "Soul" : "Relic"} ({formatPrice(material.price)})
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-body-secondary" style={{ fontSize: "11px" }}>
                          {formatDate(opportunity.buy_price_date)}
                        </div>
                      )}
                    </td>
                    <td>
                      <div>{formatPrice(opportunity.sell_price)}</div>
                      <div className="text-body-secondary" style={{ fontSize: "11px" }}>
                        {formatDate(opportunity.sell_price_date)}
                      </div>
                    </td>
                    <td className="fw-semibold">{formatPrice(opportunity.profit)}</td>
                    <td>
                      <span className="badge text-bg-success">{opportunity.profit_percent}%</span>
                    </td>
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
