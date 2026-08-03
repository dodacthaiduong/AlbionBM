import { useEffect, useMemo, useState } from "react";
import {
  getLatestPriceUpdate,
  getPriceUpdateStatus,
  startPriceUpdate,
} from "../services/api";

const SERVERS = [
  { value: "asia", label: "Asia" },
  { value: "america", label: "America" },
  { value: "europe", label: "Europe" },
];

const ACTIVE_STATUSES = new Set(["queued", "running"]);
const STATUS_LABELS = {
  queued: "Đang chờ",
  running: "Đang cập nhật",
  completed: "Hoàn tất",
  completed_with_errors: "Hoàn tất một phần",
  failed: "Thất bại",
};

const getErrorMessage = (error) =>
  error.response?.data?.error || error.message || "Đã xảy ra lỗi không xác định.";

export default function PriceUpdatePanel({ server, onServerChange, onUpdateFinished }) {
  const [job, setJob] = useState(null);
  const [loadingStatus, setLoadingStatus] = useState(true);
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState("");

  const isActive = Boolean(job && ACTIVE_STATUSES.has(job.status));
  const progress = useMemo(() => {
    if (!job?.total_batches) return 0;
    return Math.round((job.completed_batches / job.total_batches) * 100);
  }, [job]);

  useEffect(() => {
    let active = true;

    getLatestPriceUpdate(server)
      .then(({ job: latestJob }) => {
        if (active) setJob(latestJob);
      })
      .catch((requestError) => {
        if (active) setError(getErrorMessage(requestError));
      })
      .finally(() => {
        if (active) setLoadingStatus(false);
      });

    return () => {
      active = false;
    };
  }, [server]);

  useEffect(() => {
    if (!isActive || !job?.id) return undefined;

    let active = true;
    let notifiedFinished = false;
    const poll = async () => {
      try {
        const { job: updatedJob } = await getPriceUpdateStatus(job.id);
        if (active) {
          setJob(updatedJob);
          setError("");
          if (!ACTIVE_STATUSES.has(updatedJob.status) && !notifiedFinished) {
            notifiedFinished = true;
            onUpdateFinished();
          }
        }
      } catch (requestError) {
        if (active) setError(getErrorMessage(requestError));
      }
    };

    const timer = window.setInterval(poll, 1500);
    return () => {
      active = false;
      window.clearInterval(timer);
    };
  }, [isActive, job?.id, onUpdateFinished]);

  const handleServerChange = (event) => {
    setLoadingStatus(true);
    setError("");
    setJob(null);
    onServerChange(event.target.value);
  };

  const handleStart = async () => {
    setStarting(true);
    setError("");

    try {
      const response = await startPriceUpdate(server);
      setJob(response.job);
    } catch (requestError) {
      const runningJob = requestError.response?.data?.job;
      if (runningJob) setJob(runningJob);
      setError(getErrorMessage(requestError));
    } finally {
      setStarting(false);
    }
  };

  return (
    <section
      style={{
        marginBottom: "24px",
        padding: "16px",
        border: "1px solid #dbe3ec",
        borderRadius: "8px",
        background: "#f8fafc",
      }}
    >
      <div style={{ display: "flex", flexWrap: "wrap", gap: "12px", alignItems: "end" }}>
        <label style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
          <span style={{ fontWeight: 600 }}>Server</span>
          <select
            value={server}
            disabled={starting || isActive}
            onChange={handleServerChange}
            style={{ minWidth: "150px", padding: "8px" }}
          >
            {SERVERS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
        <button
          type="button"
          disabled={starting || isActive || loadingStatus}
          onClick={handleStart}
          style={{ padding: "9px 16px", fontWeight: 600 }}
        >
          {starting ? "Đang khởi tạo..." : isActive ? "Đang cập nhật giá..." : "Cập nhật tất cả giá"}
        </button>
      </div>

      {loadingStatus && <p>Đang kiểm tra trạng thái cập nhật...</p>}
      {error && <p style={{ color: "#b91c1c" }}>{error}</p>}

      {job && (
        <div aria-live="polite" style={{ marginTop: "14px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: "12px" }}>
            <strong>{STATUS_LABELS[job.status] || job.status}</strong>
            {job.total_batches > 0 && <span>{progress}%</span>}
          </div>
          <progress
            max="100"
            value={progress}
            style={{ width: "100%", height: "18px", marginTop: "6px" }}
          />
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
              gap: "6px 16px",
              marginTop: "10px",
              fontSize: "14px",
            }}
          >
            <span>Items: {job.total_items}</span>
            <span>Item IDs: {job.total_item_ids}</span>
            <span>Batch: {job.completed_batches} / {job.total_batches}</span>
            <span>Dòng current: {job.current_rows}</span>
            <span>Dòng history mới: {job.history_rows}</span>
            <span>Batch lỗi: {job.failed_batches}</span>
          </div>
          {job.error_message && <p style={{ color: "#b91c1c" }}>{job.error_message}</p>}
          {job.errors?.length > 0 && (
            <details style={{ marginTop: "8px" }}>
              <summary>Xem lỗi batch ({job.errors.length})</summary>
              <ul>
                {job.errors.map((batchError, index) => (
                  <li key={`${batchError.batch}-${index}`}>
                    Batch {batchError.batch}: {batchError.message}
                  </li>
                ))}
              </ul>
            </details>
          )}
        </div>
      )}
    </section>
  );
}
