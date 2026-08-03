-- Nạp dữ liệu vào bảng items bằng COPY (chạy sau 01_schema.sql)
-- Chạy từ psql với đường dẫn tuyệt đối tới items_data.tsv, ví dụ:
--   \copy items (unique_name, item_type, tier, weight, shop_category, shop_subcategory1, shop_subcategory2, shop_subcategory3, item_power, attributes) FROM 'items_data.tsv' WITH (FORMAT text)

\copy items (unique_name, item_type, tier, weight, shop_category, shop_subcategory1, shop_subcategory2, shop_subcategory3, item_power, attributes) FROM 'items_data.tsv' WITH (FORMAT text)
