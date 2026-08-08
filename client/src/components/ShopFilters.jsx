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
    <div className="card shadow-sm border-0 mb-4">
      <div className="card-body">
        <div className="row g-3 align-items-end">
          {SHOP_FILTER_FIELDS.map((field, index) => (
            <div className="col-auto" key={field.key}>
              <label className="form-label fw-semibold mb-1">{field.label}</label>
              <select
                className="form-select"
                value={filters[field.key] || ""}
                onChange={(event) => onFilterChange(index, event.target.value)}
              >
                <option value="">Tất cả</option>
                {getOptionsForFilter(index).map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>
          ))}
        </div>
        <div className="row g-3 align-items-end mt-1">
          {children}
          <div className="col-auto">
            <button
              className="btn btn-outline-secondary"
              disabled={!hasActiveFilters}
              onClick={onClearFilters}
            >
              Xóa bộ lọc
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
