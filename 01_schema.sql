-- ============================================================
-- Schema cho dữ liệu items.json (Albion Online item data)
-- ============================================================

CREATE TABLE IF NOT EXISTS items (
    unique_name         TEXT PRIMARY KEY,
    item_type           TEXT NOT NULL,      -- weapon, mount, simpleitem, equipmentitem, ...
    tier                SMALLINT,
    weight              NUMERIC,
    shop_category       TEXT,
    shop_subcategory1   TEXT,
    shop_subcategory2   TEXT,
    shop_subcategory3   TEXT,
    item_power          INTEGER,
    attributes          JSONB NOT NULL DEFAULT '{}'::jsonb,  -- toàn bộ field còn lại (kể cả craftingrequirements, enchantments...)
    localized_names     JSONB,
    max_quality         SMALLINT NOT NULL DEFAULT 1 CHECK (max_quality IN (1, 5)),
    max_enchant         SMALLINT NOT NULL DEFAULT 0 CHECK (max_enchant IN (0, 3, 4)),
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index để query nhanh theo loại, tier, shop category
CREATE INDEX IF NOT EXISTS idx_items_type ON items (item_type);
CREATE INDEX IF NOT EXISTS idx_items_tier ON items (tier);
CREATE INDEX IF NOT EXISTS idx_items_shop_category ON items (shop_category);

-- Index GIN để query trực tiếp trong JSONB, vd:
--   SELECT * FROM items WHERE attributes @> '{"@slottype": "mainhand"}';
--   SELECT * FROM items WHERE attributes ? 'craftingrequirements';
CREATE INDEX IF NOT EXISTS idx_items_attributes_gin ON items USING GIN (attributes);

-- Snapshot giá mới nhất, tách biệt theo server Albion.
CREATE TABLE IF NOT EXISTS item_prices_current (
    server                  TEXT NOT NULL CHECK (server IN ('asia', 'america', 'europe')),
    unique_name             TEXT NOT NULL REFERENCES items(unique_name),
    enchant                 SMALLINT NOT NULL DEFAULT 0 CHECK (enchant BETWEEN 0 AND 4),
    city                    TEXT NOT NULL CHECK (city IN (
                                'Caerleon', 'Black Market', 'Bridgewatch', 'Martlock',
                                'Lymhurst', 'Fort Sterling', 'Thetford', 'Brecilien'
                            )),
    quality                 SMALLINT NOT NULL CHECK (quality BETWEEN 1 AND 5),
    sell_price_min          INTEGER,
    sell_price_min_date     TIMESTAMPTZ,
    sell_price_max          INTEGER,
    sell_price_max_date     TIMESTAMPTZ,
    buy_price_min           INTEGER,
    buy_price_min_date      TIMESTAMPTZ,
    buy_price_max           INTEGER,
    buy_price_max_date      TIMESTAMPTZ,
    fetched_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY (server, unique_name, enchant, city, quality)
);

CREATE INDEX IF NOT EXISTS idx_item_prices_current_server_city
    ON item_prices_current (server, city);

-- Chỉ thêm snapshot vào history khi giá hoặc thời điểm nguồn thay đổi.
CREATE TABLE IF NOT EXISTS item_price_history (
    id                      BIGSERIAL PRIMARY KEY,
    server                  TEXT NOT NULL CHECK (server IN ('asia', 'america', 'europe')),
    unique_name             TEXT NOT NULL REFERENCES items(unique_name),
    enchant                 SMALLINT NOT NULL DEFAULT 0 CHECK (enchant BETWEEN 0 AND 4),
    city                    TEXT NOT NULL CHECK (city IN (
                                'Caerleon', 'Black Market', 'Bridgewatch', 'Martlock',
                                'Lymhurst', 'Fort Sterling', 'Thetford', 'Brecilien'
                            )),
    quality                 SMALLINT NOT NULL CHECK (quality BETWEEN 1 AND 5),
    sell_price_min          INTEGER,
    sell_price_min_date     TIMESTAMPTZ,
    sell_price_max          INTEGER,
    sell_price_max_date     TIMESTAMPTZ,
    buy_price_min           INTEGER,
    buy_price_min_date      TIMESTAMPTZ,
    buy_price_max           INTEGER,
    buy_price_max_date      TIMESTAMPTZ,
    fetched_at              TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_price_history_fetched_at
    ON item_price_history (fetched_at);
CREATE INDEX IF NOT EXISTS idx_price_history_lookup
    ON item_price_history (
        server, unique_name, enchant, city, quality, fetched_at DESC
    );
