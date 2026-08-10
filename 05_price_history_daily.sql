BEGIN;

DROP TABLE IF EXISTS item_price_history;

CREATE TABLE item_price_history (
    id                      BIGSERIAL PRIMARY KEY,
    server                  TEXT NOT NULL CHECK (server IN ('asia', 'america', 'europe')),
    unique_name             TEXT NOT NULL REFERENCES items(unique_name),
    enchant                 SMALLINT NOT NULL DEFAULT 0 CHECK (enchant BETWEEN 0 AND 4),
    city                    TEXT NOT NULL CHECK (city IN (
                                'Caerleon', 'Black Market', 'Bridgewatch', 'Martlock',
                                'Lymhurst', 'Fort Sterling', 'Thetford', 'Brecilien'
                            )),
    quality                 SMALLINT NOT NULL CHECK (quality BETWEEN 1 AND 5),
    price_date              TIMESTAMPTZ NOT NULL,
    avg_price               INTEGER,
    item_count              BIGINT,
    fetched_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (server, unique_name, enchant, city, quality, price_date)
);

CREATE INDEX IF NOT EXISTS idx_price_history_lookup
    ON item_price_history (server, unique_name, enchant, city, quality, price_date DESC);

COMMIT;
