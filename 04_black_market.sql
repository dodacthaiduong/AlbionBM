BEGIN;

ALTER TABLE item_prices_current
    DROP CONSTRAINT IF EXISTS item_prices_current_city_check;

ALTER TABLE item_prices_current
    ADD CONSTRAINT item_prices_current_city_check
        CHECK (city IN (
            'Caerleon', 'Black Market', 'Bridgewatch', 'Martlock',
            'Lymhurst', 'Fort Sterling', 'Thetford', 'Brecilien'
        ));

ALTER TABLE item_price_history
    DROP CONSTRAINT IF EXISTS item_price_history_city_check;

ALTER TABLE item_price_history
    ADD CONSTRAINT item_price_history_city_check
        CHECK (city IN (
            'Caerleon', 'Black Market', 'Bridgewatch', 'Martlock',
            'Lymhurst', 'Fort Sterling', 'Thetford', 'Brecilien'
        ));

COMMIT;
