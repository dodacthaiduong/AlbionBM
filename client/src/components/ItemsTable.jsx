import { useEffect, useState } from "react";
import ShopFilters from "./ShopFilters";
import {
  SHOP_FILTER_FIELDS,
  createEmptyShopFilters,
} from "../utils/shopFilters";
import { getAllItems, getShopFilterOptions } from "../services/api";

const COLUMNS = [
  { key: "english_name",   label: "Name" },
  { key: "item_type",      label: "Item Type" },
  { key: "tier",           label: "Tier" },
  { key: "attributes",     label: "Attributes" },
];

const PAGE_SIZE = 50;

const ATTRIBUTE_PREVIEW_LIMIT = 3;

const formatAttributeKey = (key) =>
  key
    .replace(/^@/, "")
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/[_-]+/g, " ")
    .replace(/^./, (character) => character.toUpperCase());

const getAttributePreview = (value) => {
  if (value === null || value === undefined || value === "") return "—";
  if (Array.isArray(value)) return `${value.length} mục`;
  if (typeof value === "object") return `${Object.keys(value).length} thuộc tính`;
  return String(value);
};

function AttributeTree({ value }) {
  if (Array.isArray(value)) {
    return (
      <ol style={{ margin: 0, paddingLeft: "22px" }}>
        {value.map((item, index) => (
          <li key={index} style={{ marginBottom: "6px" }}>
            <AttributeTree value={item} />
          </li>
        ))}
      </ol>
    );
  }

  if (value && typeof value === "object") {
    return (
      <div style={{ display: "grid", gap: "6px" }}>
        {Object.entries(value).map(([key, nestedValue]) => (
          <div
            key={key}
            style={{
              display: "grid",
              gridTemplateColumns: "minmax(120px, 0.8fr) minmax(140px, 1.2fr)",
              gap: "10px",
              alignItems: "start",
              paddingBottom: "6px",
              borderBottom: "1px solid #e5e7eb",
            }}
          >
            <span style={{ color: "#4b5563", fontWeight: 600 }} title={key}>
              {formatAttributeKey(key)}
            </span>
            <AttributeTree value={nestedValue} />
          </div>
        ))}
      </div>
    );
  }

  return <span style={{ overflowWrap: "anywhere" }}>{getAttributePreview(value)}</span>;
}

function AttributesCell({ attributes }) {
  if (!attributes || typeof attributes !== "object") return "—";

  const entries = Object.entries(attributes);
  if (entries.length === 0) return "—";

  return (
    <div style={{ minWidth: "280px", maxWidth: "420px" }}>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "5px", marginBottom: "7px" }}>
        {entries.slice(0, ATTRIBUTE_PREVIEW_LIMIT).map(([key, value]) => (
          <span
            key={key}
            title={`${key}: ${getAttributePreview(value)}`}
            style={{
              maxWidth: "100%",
              padding: "3px 7px",
              border: "1px solid #dbe3ec",
              borderRadius: "999px",
              background: "#f8fafc",
              color: "#334155",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            <strong>{formatAttributeKey(key)}:</strong> {getAttributePreview(value)}
          </span>
        ))}
      </div>
      <details>
        <summary style={{ color: "#2563eb", cursor: "pointer", userSelect: "none" }}>
          Xem tất cả {entries.length} thuộc tính
        </summary>
        <div
          style={{
            maxHeight: "360px",
            marginTop: "8px",
            padding: "10px",
            overflow: "auto",
            border: "1px solid #dbe3ec",
            borderRadius: "6px",
            background: "#ffffff",
          }}
        >
          <AttributeTree value={attributes} />
        </div>
      </details>
    </div>
  );
}

export default function ItemsTable() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [filters, setFilters] = useState(createEmptyShopFilters);
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
      .catch((err) => {
        if (active) setFilterError(err.message);
      });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let active = true;

    getAllItems(page, PAGE_SIZE, filters)
      .then((data) => {
        if (!active) return;
        setItems(data.items);
        setTotal(data.total);
        setTotalPages(data.totalPages);
        setLoading(false);
      })
      .catch((err) => {
        if (!active) return;
        setError(err.message);
        setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [page, filters]);

  const beginReload = () => {
    setLoading(true);
    setError(null);
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
    setPage(1);
  };

  const changePage = (nextPage) => {
    beginReload();
    setPage(nextPage);
  };


  const pagination = (
    <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
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
    </div>
  );

  return (
    <div style={{ overflowX: "auto" }}>
      <h2>
        Danh sách Items ({items.length} / {total})
      </h2>

      <ShopFilters
        filters={filters}
        filterOptions={filterOptions}
        filterLabels={filterLabels}
        onFilterChange={handleFilterChange}
        onClearFilters={clearFilters}
      />

      {filterError && (
        <p style={{ color: "red" }}>Không thể tải tùy chọn bộ lọc: {filterError}</p>
      )}
      {error && <p style={{ color: "red" }}>Lỗi: {error}</p>}

      <div style={{ marginBottom: "10px" }}>{pagination}</div>

      <table border="1" cellPadding="6" style={{ borderCollapse: "collapse", fontSize: "14px" }}>
        <thead>
          <tr style={{ background: "#f0f0f0" }}>
            {COLUMNS.map((col) => (
              <th key={col.key}>{col.label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <tr>
              <td colSpan={COLUMNS.length}>Đang tải dữ liệu...</td>
            </tr>
          ) : items.length === 0 ? (
            <tr>
              <td colSpan={COLUMNS.length}>Không tìm thấy item phù hợp.</td>
            </tr>
          ) : (
            items.map((item) => (
              <tr key={item.unique_name}>
                {COLUMNS.map((col) => (
                  <td
                    key={col.key}
                    style={{ verticalAlign: col.key === "attributes" ? "top" : "middle" }}
                  >
                    {col.key === "attributes" ? (
                      <AttributesCell attributes={item[col.key]} />
                    ) : (
                      item[col.key] ?? "—"
                    )}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>

      <div style={{ marginTop: "10px" }}>{pagination}</div>
    </div>
  );
}
