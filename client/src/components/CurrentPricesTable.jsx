import { useEffect, useState } from "react";
import ShopFilters from "./ShopFilters";
import {
  SHOP_FILTER_FIELDS,
  createEmptyShopFilters,
  hasActiveShopFilters,
} from "../utils/shopFilters";
import { getCurrentPrices, getShopFilterOptions } from "../services/api";
import { getErrorMessage } from "../utils/errors.js";

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
const CITY_OPTIONS = [
  "Caerleon",
  "Black Market",
  "Bridgewatch",
  "Martlock",
  "Lymhurst",
  "Fort Sterling",
  "Thetford",
  "Brecilien",
];
const QUALITY_OPTIONS = [1, 2, 3, 4, 5];
const DEFAULT_QUALITY_FILTER = "1";
const DEFAULT_MIN_PRICE_DISCOUNT_PERCENT = "10";
const MARKET_TAX_MULTIPLIER = 0.935;

const formatPrice = (price) =>
  price === null || price === undefined ? "—" : new Intl.NumberFormat("en-US").format(price);

const formatDate = (value) => {
  if (!value) return "Không có dữ liệu";
  return new Intl.DateTimeFormat("vi-VN", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(value));
};

const getDiscountMultiplier = (discountPercent) => {
  const percent = Number(discountPercent);
  if (!Number.isFinite(percent)) return 1;

  return Math.max(0, 1 - percent / 100);
};

const getRecommendedBuyPrice = (sellPriceMin, discountPercent) => {
  if (sellPriceMin === null || sellPriceMin === undefined) return null;

  const price = Number(sellPriceMin);
  return Number.isFinite(price)
    ? Math.floor(price * MARKET_TAX_MULTIPLIER * getDiscountMultiplier(discountPercent))
    : null;
};

function PriceCell({ price, date }) {
  return (
    <div className="text-nowrap">
      <strong>{formatPrice(price)}</strong>
      <div className="text-body-secondary" style={{ marginTop: "2px", fontSize: "11px" }}>
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
  const [cityFilter, setCityFilter] = useState("");
  const [qualityFilter, setQualityFilter] = useState(DEFAULT_QUALITY_FILTER);
  const [enchantFilter, setEnchantFilter] = useState("");
  const [minPriceDiscountPercent, setMinPriceDiscountPercent] = useState(
    DEFAULT_MIN_PRICE_DISCOUNT_PERCENT
  );
  const [filterOptions, setFilterOptions] = useState([]);
  const [filterLabels, setFilterLabels] = useState({});
  const [filterError, setFilterError] = useState(null);

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

    getCurrentPrices(page, PAGE_SIZE, server, {
      ...filters,
      tier: tierFilter,
      city: cityFilter,
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
        setError(getErrorMessage(requestError));
        setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [page, server, refreshKey, filters, tierFilter, cityFilter, qualityFilter, enchantFilter]);

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

  const handleCityFilterChange = (value) => {
    beginReload();
    setCityFilter(value);
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

  const handleMinPriceDiscountChange = (value) => {
    setMinPriceDiscountPercent(value);
  };

  const clearFilters = () => {
    beginReload();
    setFilters(createEmptyShopFilters());
    setTierFilter("");
    setCityFilter("");
    setQualityFilter(DEFAULT_QUALITY_FILTER);
    setEnchantFilter("");
    setPage(1);
  };

  const reload = () => {
    beginReload();
    getCurrentPrices(page, PAGE_SIZE, server, {
      ...filters,
      tier: tierFilter,
      city: cityFilter,
      quality: qualityFilter,
      enchant: enchantFilter,
    })
      .then((data) => {
        setPrices(data.prices);
        setTotal(data.total);
        setTotalPages(data.totalPages);
      })
      .catch((requestError) => {
        setError(getErrorMessage(requestError));
      })
      .finally(() => setLoading(false));
  };

  const hasActiveFilters =
    hasActiveShopFilters(filters) ||
    tierFilter !== "" ||
    cityFilter !== "" ||
    qualityFilter !== DEFAULT_QUALITY_FILTER ||
    enchantFilter !== "";

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
      <button className="btn btn-outline-primary btn-sm ms-1" disabled={loading} onClick={reload}>
        Tải lại
      </button>
    </div>
  );

  return (
    <section className="card shadow-sm border-0">
      <div className="card-body">
        <h2 className="h5 mb-3">
          Giá hiện tại — {server.toUpperCase()} ({prices.length} / {total})
        </h2>

        {error && <div className="alert alert-danger">{error}</div>}
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
            <select
              className="form-select"
              value={tierFilter}
              onChange={(event) => handleTierFilterChange(event.target.value)}
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
              onChange={(event) => handleEnchantFilterChange(event.target.value)}
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
              onChange={(event) => handleQualityFilterChange(event.target.value)}
            >
              <option value="">Tất cả</option>
              {QUALITY_OPTIONS.map((quality) => (
                <option key={quality} value={quality}>
                  {QUALITY_LABELS[quality] || quality}
                </option>
              ))}
            </select>
          </div>
          <div className="col-auto">
            <label className="form-label fw-semibold mb-1">% trừ min price</label>
            <input
              type="number"
              className="form-control"
              min="0"
              max="100"
              step="1"
              value={minPriceDiscountPercent}
              onChange={(event) => handleMinPriceDiscountChange(event.target.value)}
            />
          </div>
          <div className="col-auto">
            <label className="form-label fw-semibold mb-1">City</label>
            <select
              className="form-select"
              value={cityFilter}
              onChange={(event) => handleCityFilterChange(event.target.value)}
            >
              <option value="">Tất cả</option>
              {CITY_OPTIONS.map((city) => (
                <option key={city} value={city}>
                  {city}
                </option>
              ))}
            </select>
          </div>
        </ShopFilters>
        {filterError && <div className="alert alert-danger">Không thể tải tùy chọn bộ lọc: {filterError}</div>}
        <div className="mb-3">{pagination}</div>

        <div className="table-responsive">
          <table className="table table-hover table-striped align-middle small">
            <thead className="table-light">
              <tr>
                <th>Item</th>
                <th>Enchant</th>
                <th>City</th>
                <th>Quality</th>
                <th>Sell min</th>
                <th>Giá nhập khuyến nghị</th>
                <th>Sell max</th>
                <th>Fetched at</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="8" className="text-center text-body-secondary py-4">
                    Đang tải giá hiện tại...
                  </td>
                </tr>
              ) : prices.length === 0 ? (
                <tr>
                  <td colSpan="8" className="text-center text-body-secondary py-4">
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
                      <div className="text-body-secondary" style={{ fontSize: "11px" }}>
                        {price.unique_name}
                      </div>
                    </td>
                    <td className="text-center">{price.enchant}</td>
                    <td>{price.city}</td>
                    <td title={`Quality ${price.quality}`}>
                      {QUALITY_LABELS[price.quality] || price.quality}
                    </td>
                    <td><PriceCell price={price.sell_price_min} date={price.sell_price_min_date} /></td>
                    <td className="text-nowrap text-end">
                      <strong>
                        {formatPrice(
                          getRecommendedBuyPrice(price.sell_price_min, minPriceDiscountPercent)
                        )}
                      </strong>
                    </td>
                    <td><PriceCell price={price.sell_price_max} date={price.sell_price_max_date} /></td>
                    <td className="text-nowrap">{formatDate(price.fetched_at)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="mt-3">{pagination}</div>
      </div>
    </section>
  );
}
