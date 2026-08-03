import {
  SHOP_FILTER_FIELDS,
  getUniqueValues,
  hasActiveShopFilters,
} from "../utils/shopFilters";

export default function ShopFilters({
  filters,
  filterOptions,
  onFilterChange,
  onClearFilters,
  hasActiveFilters: hasActiveFiltersOverride,
  children,
}) {
  const getOptionsForFilter = (index) => {
    const matchingRows = filterOptions.filter((row) =>
      SHOP_FILTER_FIELDS.slice(0, index).every(
        ({ key }) => !filters[key] || row[key] === filters[key]
      )
    );

    return getUniqueValues(matchingRows, SHOP_FILTER_FIELDS[index].key);
  };

  const hasActiveFilters = hasActiveFiltersOverride ?? hasActiveShopFilters(filters);

  return (
    <div
      style={{
        marginBottom: "16px",
        display: "flex",
        flexWrap: "wrap",
        gap: "12px",
        alignItems: "end",
      }}
    >
      {SHOP_FILTER_FIELDS.map((field, index) => (
        <label
          key={field.key}
          style={{ display: "flex", flexDirection: "column", gap: "4px" }}
        >
          <span>{field.label}</span>
          <select
            value={filters[field.key] || ""}
            onChange={(event) => onFilterChange(index, event.target.value)}
            style={{ minWidth: "180px", padding: "6px" }}
          >
            <option value="">Tất cả</option>
            {getOptionsForFilter(index).map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </label>
      ))}
      {children}
      <button
        disabled={!hasActiveFilters}
        onClick={onClearFilters}
        style={{ padding: "7px 12px" }}
      >
        Xóa bộ lọc
      </button>
    </div>
  );
}
