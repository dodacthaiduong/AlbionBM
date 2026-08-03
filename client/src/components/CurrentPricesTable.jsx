import { useEffect, useState } from "react";
import ShopFilters from "./ShopFilters";
import {
  SHOP_FILTER_FIELDS,
  createEmptyShopFilters,
  hasActiveShopFilters,
} from "../utils/shopFilters";
import { getCurrentPrices, getShopFilterOptions } from "../services/api";

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
const DEFAULT_QUALITY_FILTER = "1";

const formatPrice = (price) =>
  price === null || price === undefined ? "—" : new Intl.NumberFormat("en-US").format(price);

const formatDate = (value) => {
  if (!value) return "Không có dữ liệu";
  return new Intl.DateTimeFormat("vi-VN", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(value));
};

function PriceCell({ price, date }) {
  return (
    <div style={{ whiteSpace: "nowrap" }}>
      <strong>{formatPrice(price)}</strong>
      <div style={{ marginTop: "2px", color: "#64748b", fontSize: "11px" }}>
        {formatDate(date)}
      </div>
    </div>
  );
}

export default function CurrentPricesTable({ server, refreshKey }) {
  const [prices, setPrices] = useState([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filters, setFilters] = useState(createEmptyShopFilters);
  const [tierFilter, setTierFilter] = useState("");
  const [qualityFilter, setQualityFilter] = useState(DEFAULT_QUALITY_FILTER);
  const [enchantFilter, setEnchantFilter] = useState("");
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

    getCurrentPrices(page, PAGE_SIZE, server, {
      ...filters,
      tier: tierFilter,
      quality: qualityFilter,
      enchant: enchantFilter,
    })
      .then((data) => {
        if (!active) return;
        setPrices(data.prices);
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
  }, [page, server, refreshKey, filters, tierFilter, qualityFilter, enchantFilter]);

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

  const handleTierFilterChange = (value) => {
    beginReload();
    setTierFilter(value);
    setPage(1);
  };

  const handleQualityFilterChange = (value) => {
    beginReload();
    setQualityFilter(value);
    setPage(1);
  };

  const handleEnchantFilterChange = (value) => {
    beginReload();
    setEnchantFilter(value);
    setPage(1);
  };

  const clearFilters = () => {
    beginReload();
    setFilters(createEmptyShopFilters());
    setTierFilter("");
    setQualityFilter(DEFAULT_QUALITY_FILTER);
    setEnchantFilter("");
    setPage(1);
  };

  const reload = () => {
    beginReload();
    getCurrentPrices(page, PAGE_SIZE, server, {
      ...filters,
      tier: tierFilter,
      quality: qualityFilter,
      enchant: enchantFilter,
    })
      .then((data) => {
        setPrices(data.prices);
        setTotal(data.total);
        setTotalPages(data.totalPages);
      })
      .catch((requestError) => {
        setError(requestError.response?.data?.error || requestError.message);
      })
      .finally(() => setLoading(false));
  };

  const hasActiveFilters =
    hasActiveShopFilters(filters) ||
    tierFilter !== "" ||
    qualityFilter !== DEFAULT_QUALITY_FILTER ||
    enchantFilter !== "";

  const pagination = (
    <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", alignItems: "center" }}>
      <button disabled={page <= 1 || loading} onClick={() => changePage(1)}>
        ««
      </button>
      <button disabled={page <= 1 || loading} onClick={() => changePage(page - 1)}>
        « Trước
      </button>
      <span>
        Trang {totalPages === 0 ? 0 : page} / {totalPages}
      </span>
      <button
        disabled={page >= totalPages || loading}
        onClick={() => changePage(page + 1)}
      >
        Sau »
      </button>
      <button
        disabled={page >= totalPages || loading}
        onClick={() => changePage(totalPages)}
      >
        »»
      </button>
      <button disabled={loading} onClick={reload} style={{ marginLeft: "4px" }}>
        Tải lại
      </button>
    </div>
  );

  return (
    <section>
      <h2>
        Giá hiện tại — {server.toUpperCase()} ({prices.length} / {total})
      </h2>

      {error && <p style={{ color: "#b91c1c" }}>Lỗi: {error}</p>}
      <ShopFilters
        filters={filters}
        filterOptions={filterOptions}
        onFilterChange={handleFilterChange}
        onClearFilters={clearFilters}
        hasActiveFilters={hasActiveFilters}
      >
        <label style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
          <span>Enchant</span>
          <select
            value={enchantFilter}
            onChange={(event) => handleEnchantFilterChange(event.target.value)}
            style={{ minWidth: "120px", padding: "6px" }}
          >
            <option value="">Tất cả</option>
            {ENCHANT_OPTIONS.map((enchant) => (
              <option key={enchant} value={enchant}>
                {enchant}
              </option>
            ))}
          </select>
        </label>
        <label style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
          <span>Tier</span>
          <select
            value={tierFilter}
            onChange={(event) => handleTierFilterChange(event.target.value)}
            style={{ minWidth: "120px", padding: "6px" }}
          >
            <option value="">Tất cả</option>
            {TIER_OPTIONS.map((tier) => (
              <option key={tier} value={tier}>
                {tier}
              </option>
            ))}
          </select>
        </label>
        <label style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
          <span>Quality</span>
          <select
            value={qualityFilter}
            onChange={(event) => handleQualityFilterChange(event.target.value)}
            style={{ minWidth: "150px", padding: "6px" }}
          >
            <option value="">Tất cả</option>
            {QUALITY_OPTIONS.map((quality) => (
              <option key={quality} value={quality}>
                {QUALITY_LABELS[quality] || quality}
              </option>
            ))}
          </select>
        </label>
      </ShopFilters>
      {filterError && (
        <p style={{ color: "#b91c1c" }}>
          Không thể tải tùy chọn bộ lọc: {filterError}
        </p>
      )}
      <div style={{ marginBottom: "10px" }}>{pagination}</div>

      <div style={{ overflowX: "auto" }}>
        <table
          border="1"
          cellPadding="7"
          style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}
        >
          <thead>
            <tr style={{ background: "#f0f0f0" }}>
              <th>Item</th>
              <th>Enchant</th>
              <th>City</th>
              <th>Quality</th>
              <th>Sell min</th>
              <th>Sell max</th>
              <th>Buy min</th>
              <th>Buy max</th>
              <th>Fetched at</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="9">Đang tải giá hiện tại...</td>
              </tr>
            ) : prices.length === 0 ? (
              <tr>
                <td colSpan="9">
                  {hasActiveFilters
                    ? "Không có dữ liệu giá phù hợp với bộ lọc hiện tại."
                    : "Chưa có dữ liệu giá cho server này. Hãy bấm “Cập nhật tất cả giá”."}
                </td>
              </tr>
            ) : (
              prices.map((price) => (
                <tr
                  key={`${price.server}-${price.unique_name}-${price.enchant}-${price.city}-${price.quality}`}
                >
                  <td>
                    <strong>{price.english_name || price.unique_name}</strong>
                    <div style={{ color: "#64748b", fontSize: "11px" }}>
                      {price.unique_name}
                    </div>
                  </td>
                  <td style={{ textAlign: "center" }}>{price.enchant}</td>
                  <td>{price.city}</td>
                  <td title={`Quality ${price.quality}`}>
                    {QUALITY_LABELS[price.quality] || price.quality}
                  </td>
                  <td><PriceCell price={price.sell_price_min} date={price.sell_price_min_date} /></td>
                  <td><PriceCell price={price.sell_price_max} date={price.sell_price_max_date} /></td>
                  <td><PriceCell price={price.buy_price_min} date={price.buy_price_min_date} /></td>
                  <td><PriceCell price={price.buy_price_max} date={price.buy_price_max_date} /></td>
                  <td style={{ whiteSpace: "nowrap" }}>{formatDate(price.fetched_at)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div style={{ marginTop: "10px" }}>{pagination}</div>
    </section>
  );
}
