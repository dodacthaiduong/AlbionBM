-- Nạp dữ liệu crafting vào bảng (chạy sau 05_crafting_recipes.sql)
-- Chạy từ psql với đường dẫn tuyệt đối tới các file TSV, ví dụ:
--   \copy crafting_recipes FROM 'crafting_recipes.tsv' WITH (FORMAT text)
--   \copy crafting_recipe_materials FROM 'crafting_materials.tsv' WITH (FORMAT text)

\copy crafting_recipes (item_unique_name, enchant_level, craft_time, silver, crafting_focus) FROM 'crafting_recipes.tsv' WITH (FORMAT text)
\copy crafting_recipe_materials (item_unique_name, enchant_level, material_unique_name, count) FROM 'crafting_materials.tsv' WITH (FORMAT text)
