-- 06_bm_30d_summary.sql
BEGIN;

CREATE TABLE IF NOT EXISTS item_bm_30d (
    server       TEXT NOT NULL CHECK (server IN ('asia', 'america', 'europe')),
    unique_name  TEXT NOT NULL REFERENCES items(unique_name),
    enchant      SMALLINT NOT NULL DEFAULT 0 CHECK (enchant BETWEEN 0 AND 4),
    bm_avg_30d   INTEGER,
    bm_sold_30d  DOUBLE PRECISION,
    PRIMARY KEY (server, unique_name, enchant)
);

COMMIT;
