import { useEffect, useMemo, useState } from "react";
import {
  getLatestPriceUpdate,
  getPriceUpdateStatus,
  startPriceUpdate,
} from "../services/api";
import { getErrorMessage } from "../utils/errors.js";

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
    <section className="card shadow-sm border-0">
      <div className="card-body">
        <div className="row g-3 align-items-end">
          <div className="col-auto">
            <label className="form-label fw-semibold mb-1">Server</label>
            <select
              className="form-select"
              value={server}
              disabled={starting || isActive}
              onChange={handleServerChange}
            >
              {SERVERS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          <div className="col-auto">
            <button
              type="button"
              className="btn btn-primary fw-semibold"
              disabled={starting || isActive || loadingStatus}
              onClick={handleStart}
            >
              {starting
                ? "Đang khởi tạo..."
                : isActive
                  ? "Đang cập nhật giá..."
                  : "Cập nhật tất cả giá"}
            </button>
          </div>
        </div>

        {loadingStatus && (
          <div className="text-body-secondary mt-3">Đang kiểm tra trạng thái cập nhật...</div>
        )}
        {error && <div className="alert alert-danger mt-3 mb-0">{error}</div>}

        {job && (
          <div aria-live="polite" className="mt-3">
            <div className="d-flex justify-content-between align-items-center mb-1">
              <strong>{STATUS_LABELS[job.status] || job.status}</strong>
              {job.total_batches > 0 && <span>{progress}%</span>}
            </div>
            <div className="progress" role="progressbar" aria-valuenow={progress} aria-valuemin="0" aria-valuemax="100">
              <div
                className="progress-bar"
                style={{ width: `${progress}%` }}
              >
                {progress}%
              </div>
            </div>
            <div className="row g-2 mt-2 small">
              <div className="col-6 col-md-4 col-lg-2">Items: {job.total_items}</div>
              <div className="col-6 col-md-4 col-lg-2">Item IDs: {job.total_item_ids}</div>
              <div className="col-6 col-md-4 col-lg-2">Batch: {job.completed_batches} / {job.total_batches}</div>
              <div className="col-6 col-md-4 col-lg-2">Dòng current: {job.current_rows}</div>
              <div className="col-6 col-md-4 col-lg-2">Dòng history: {job.history_rows}</div>
              <div className="col-6 col-md-4 col-lg-2">Batch lỗi: {job.failed_batches}</div>
            </div>
            {job.error_message && <div className="alert alert-danger mt-2 mb-0">{job.error_message}</div>}
            {job.errors?.length > 0 && (
              <details className="mt-2">
                <summary>Xem lỗi batch ({job.errors.length})</summary>
                <ul className="mb-0 mt-2">
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
      </div>
    </section>
  );
}
