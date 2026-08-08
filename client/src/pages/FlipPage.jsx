import { useEffect, useState } from "react";
import ShopFilters from "../components/ShopFilters";
import {
  SHOP_FILTER_FIELDS,
  createEmptyShopFilters,
  hasActiveShopFilters,
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

const SERVERS = [
  { value: "asia", label: "Asia" },
  { value: "america", label: "America" },
  { value: "europe", label: "Europe" },
];

const formatPrice = (price) =>
  price === null || price === undefined
    ? "—"
    : new Intl.NumberFormat("en-US").format(price);

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
  const [filterOptions, setFilterOptions] = useState([]);
  const [filterError, setFilterError] = useState(null);

  useEffect(() => {
    let active = true;

    getShopFilterOptions()
      .then((data) => {
        if (active) setFilterOptions(data.options);
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
  }, [page, server, filters, tierFilter, enchantFilter, qualityFilter]);

  const beginReload = () => {
    setLoading(true);
    setError("");
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
    setPage(1);
  };

  const handleServerChange = (event) => {
    beginReload();
    setServer(event.target.value);
    setPage(1);
  };

  const hasActiveFilters =
    hasActiveShopFilters(filters) ||
    tierFilter !== "" ||
    enchantFilter !== "" ||
    qualityFilter !== "";

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
    </div>
  );

  return (
    <div>
      <div className="d-flex flex-wrap justify-content-between align-items-center mb-3 gap-2">
        <h2 className="h4 mb-0">
          Cơ hội flip — {server.toUpperCase()} ({total})
        </h2>
        <div className="d-flex align-items-center gap-2">
          <label className="form-label fw-semibold mb-0">Server</label>
          <select className="form-select form-select-sm" value={server} onChange={handleServerChange}>
            {SERVERS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {error && <div className="alert alert-danger">Lỗi: {error}</div>}

      <ShopFilters
        filters={filters}
        filterOptions={filterOptions}
        onFilterChange={handleFilterChange}
        onClearFilters={clearFilters}
        hasActiveFilters={hasActiveFilters}
      >
        <div className="col-auto">
          <label className="form-label fw-semibold mb-1">Tier</label>
          <select
            className="form-select"
            value={tierFilter}
            onChange={(event) => {
              beginReload();
              setTierFilter(event.target.value);
              setPage(1);
            }}
          >
            <option value="">Tất cả</option>
            {TIER_OPTIONS.map((tier) => (
              <option key={tier} value={tier}>
                {tier}
              </option>
            ))}
          </select>
        </div>
        <div className="col-auto">
          <label className="form-label fw-semibold mb-1">Enchant</label>
          <select
            className="form-select"
            value={enchantFilter}
            onChange={(event) => {
              beginReload();
              setEnchantFilter(event.target.value);
              setPage(1);
            }}
          >
            <option value="">Tất cả</option>
            {ENCHANT_OPTIONS.map((enchant) => (
              <option key={enchant} value={enchant}>
                {enchant}
              </option>
            ))}
          </select>
        </div>
        <div className="col-auto">
          <label className="form-label fw-semibold mb-1">Quality</label>
          <select
            className="form-select"
            value={qualityFilter}
            onChange={(event) => {
              beginReload();
              setQualityFilter(event.target.value);
              setPage(1);
            }}
          >
            <option value="">Tất cả</option>
            {QUALITY_OPTIONS.map((quality) => (
              <option key={quality} value={quality}>
                {QUALITY_LABELS[quality] || quality}
              </option>
            ))}
          </select>
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
                <th>Thành bán</th>
                <th>Giá bán</th>
                <th>Lời</th>
                <th>Lời %</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="9" className="text-center text-body-secondary py-4">
                    Đang tính cơ hội flip...
                  </td>
                </tr>
              ) : opportunities.length === 0 ? (
                <tr>
                  <td colSpan="9" className="text-center text-body-secondary py-4">
                    {hasActiveFilters
                      ? "Không có cơ hội flip phù hợp với bộ lọc hiện tại."
                      : "Chưa có cơ hội flip cho server này. Hãy cập nhật giá trước."}
                  </td>
                </tr>
              ) : (
                opportunities.map((opportunity) => (
                  <tr
                    key={`${opportunity.unique_name}-${opportunity.enchant}-${opportunity.quality}-${opportunity.buy_city}-${opportunity.sell_city}`}
                  >
                    <td>
                      <strong>{opportunity.english_name || opportunity.unique_name}</strong>
                      <div className="text-body-secondary" style={{ fontSize: "11px" }}>
                        {opportunity.unique_name}
                      </div>
                    </td>
                    <td>{opportunity.enchant}</td>
                    <td>{QUALITY_LABELS[opportunity.quality] || opportunity.quality}</td>
                    <td>{opportunity.buy_city}</td>
                    <td>{formatPrice(opportunity.buy_price)}</td>
                    <td>{opportunity.sell_city}</td>
                    <td>{formatPrice(opportunity.sell_price)}</td>
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
