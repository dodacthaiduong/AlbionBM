import { useEffect, useId, useRef, useState } from "react";
import { valueToArray, arrayToValue } from "../utils/shopFilters";

export default function MultiSelectDropdown({
  value,
  onChange,
  options,
  getLabel = (option) => option,
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);
  const selectAllId = useId();
  const selected = valueToArray(value);

  useEffect(() => {
    if (!open) return undefined;
    const onPointerDown = (event) => {
      if (rootRef.current && !rootRef.current.contains(event.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [open]);

  const toggleOption = (option) => {
    const next = selected.includes(option)
      ? selected.filter((item) => item !== option)
      : [...selected, option];
    onChange(arrayToValue(next));
  };

  const allSelected = options.length > 0 && options.every((option) => selected.includes(option));

  const summary =
    selected.length === 0
      ? "Tất cả"
      : selected.length === 1
        ? getLabel(selected[0])
        : `${selected.length} mục đã chọn`;

  return (
    <div className="multi-select" ref={rootRef}>
      <button
        type="button"
        className="btn btn-outline-secondary w-100 text-start d-flex justify-content-between align-items-center"
        onClick={() => setOpen((current) => !current)}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span className="text-truncate">{summary}</span>
        <span className="ms-1 small">{open ? "▲" : "▼"}</span>
      </button>
      {open && (
        <div className="multi-select-panel" role="listbox" aria-multiselectable="true">
          <div className="d-flex align-items-center justify-content-between px-2 py-1 border-bottom">
            <span className="form-check">
              <input
                type="checkbox"
                className="form-check-input"
                id={selectAllId}
                checked={allSelected}
                onChange={() => {
                  onChange(allSelected ? "" : arrayToValue(options));
                }}
              />
              <label className="form-check-label small text-body-secondary" htmlFor={selectAllId}>
                Tất cả
              </label>
            </span>
            {selected.length > 0 && (
              <button
                type="button"
                className="btn btn-link btn-sm text-decoration-none p-0"
                onClick={() => onChange("")}
              >
                Bỏ chọn
              </button>
            )}
          </div>
          <div className="multi-select-list">
            {options.map((option) => (
              <label
                key={option}
                className={`form-check d-block px-2 py-1 mb-0 multi-select-item${
                  selected.includes(option) ? " selected" : ""
                }`}
              >
                <input
                  type="checkbox"
                  className="form-check-input"
                  checked={selected.includes(option)}
                  onChange={() => toggleOption(option)}
                />
                <span className="form-check-label">{getLabel(option)}</span>
              </label>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
