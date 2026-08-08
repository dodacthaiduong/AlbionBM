import {
  SHOP_FILTER_FIELDS,
  getUniqueValues,
  hasActiveShopFilters,
  valueToArray,
  arrayToValue,
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
      SHOP_FILTER_FIELDS.slice(0, index).every(({ key }) => {
        const activeValues = valueToArray(filters[key]);
        return activeValues.length === 0 || activeValues.includes(row[key]);
      })
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
                multiple
                size={4}
                value={valueToArray(filters[field.key])}
                onChange={(event) =>
                  onFilterChange(
                    index,
                    arrayToValue(Array.from(event.target.selectedOptions, (o) => o.value))
                  )
                }
              >
                {getOptionsForFilter(index).map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
              <div className="form-text">
                Giữ Ctrl (hoặc Cmd) để chọn nhiều. Bỏ chọn hết = Tất cả.
              </div>
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
