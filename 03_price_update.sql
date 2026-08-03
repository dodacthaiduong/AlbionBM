BEGIN;

-- Đồng bộ ràng buộc dữ liệu nguồn dùng để sinh item_id.
ALTER TABLE items
    ALTER COLUMN max_quality SET DEFAULT 1,
    ALTER COLUMN max_quality SET NOT NULL,
    ALTER COLUMN max_enchant SET DEFAULT 0,
    ALTER COLUMN max_enchant SET NOT NULL;

ALTER TABLE items
    DROP CONSTRAINT IF EXISTS items_max_quality_check,
    DROP CONSTRAINT IF EXISTS items_max_enchant_check;

ALTER TABLE items
    ADD CONSTRAINT items_max_quality_check CHECK (max_quality IN (1, 5)),
    ADD CONSTRAINT items_max_enchant_check CHECK (max_enchant IN (0, 3, 4));

-- Giá của ba server không được dùng chung một khóa.
ALTER TABLE item_prices_current
    ADD COLUMN IF NOT EXISTS server TEXT;

ALTER TABLE item_price_history
    ADD COLUMN IF NOT EXISTS server TEXT;

-- Hai bảng hiện chưa có dữ liệu; UPDATE vẫn giúp migration an toàn nếu đã có
-- snapshot cũ và coi chúng là dữ liệu Asia theo mặc định mới của ứng dụng.
UPDATE item_prices_current SET server = 'asia' WHERE server IS NULL;
UPDATE item_price_history SET server = 'asia' WHERE server IS NULL;

ALTER TABLE item_prices_current
    ALTER COLUMN server SET NOT NULL;

ALTER TABLE item_price_history
    ALTER COLUMN server SET NOT NULL;

ALTER TABLE item_prices_current
    DROP CONSTRAINT IF EXISTS item_prices_current_pkey,
    DROP CONSTRAINT IF EXISTS item_prices_current_server_check,
    DROP CONSTRAINT IF EXISTS item_prices_current_enchant_check,
    DROP CONSTRAINT IF EXISTS item_prices_current_quality_check,
    DROP CONSTRAINT IF EXISTS item_prices_current_city_check;

ALTER TABLE item_prices_current
    ADD CONSTRAINT item_prices_current_pkey
        PRIMARY KEY (server, unique_name, enchant, city, quality),
    ADD CONSTRAINT item_prices_current_server_check
        CHECK (server IN ('asia', 'america', 'europe')),
    ADD CONSTRAINT item_prices_current_enchant_check
        CHECK (enchant BETWEEN 0 AND 4),
    ADD CONSTRAINT item_prices_current_quality_check
        CHECK (quality BETWEEN 1 AND 5),
    ADD CONSTRAINT item_prices_current_city_check
        CHECK (city IN (
            'Caerleon', 'Black Market', 'Bridgewatch', 'Martlock',
            'Lymhurst', 'Fort Sterling', 'Thetford', 'Brecilien'
        ));

ALTER TABLE item_price_history
    DROP CONSTRAINT IF EXISTS item_price_history_server_check,
    DROP CONSTRAINT IF EXISTS item_price_history_enchant_check,
    DROP CONSTRAINT IF EXISTS item_price_history_quality_check,
    DROP CONSTRAINT IF EXISTS item_price_history_city_check;

ALTER TABLE item_price_history
    ADD CONSTRAINT item_price_history_server_check
        CHECK (server IN ('asia', 'america', 'europe')),
    ADD CONSTRAINT item_price_history_enchant_check
        CHECK (enchant BETWEEN 0 AND 4),
    ADD CONSTRAINT item_price_history_quality_check
        CHECK (quality BETWEEN 1 AND 5),
    ADD CONSTRAINT item_price_history_city_check
        CHECK (city IN (
            'Caerleon', 'Black Market', 'Bridgewatch', 'Martlock',
            'Lymhurst', 'Fort Sterling', 'Thetford', 'Brecilien'
        ));

DROP INDEX IF EXISTS idx_item_prices_current_city;
CREATE INDEX IF NOT EXISTS idx_item_prices_current_server_city
    ON item_prices_current (server, city);

DROP INDEX IF EXISTS idx_price_history_lookup;
CREATE INDEX IF NOT EXISTS idx_price_history_lookup
    ON item_price_history (
        server, unique_name, enchant, city, quality, fetched_at DESC
    );

COMMIT;
