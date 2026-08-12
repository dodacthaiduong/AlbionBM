-- ============================================================
-- Schema cho crafting recipes (cách craft 1 món đồ)
-- Nguồn: gameinfo.albiononline.com/api/gameinfo/items/<name>/data
--   craftingRequirements (enchant 0) + enchantments[] (enchant 1-4)
-- ============================================================

-- Mỗi item + mỗi cấp enchant có 1 recipe riêng.
CREATE TABLE IF NOT EXISTS crafting_recipes (
    item_unique_name    TEXT NOT NULL REFERENCES items(unique_name),
    enchant_level       SMALLINT NOT NULL DEFAULT 0 CHECK (enchant_level BETWEEN 0 AND 4),
    craft_time          REAL NOT NULL,          -- giây
    silver              INTEGER NOT NULL DEFAULT 0,
    crafting_focus      INTEGER NOT NULL DEFAULT 0,
    PRIMARY KEY (item_unique_name, enchant_level)
);

-- Nguyên liệu của từng recipe.
CREATE TABLE IF NOT EXISTS crafting_recipe_materials (
    item_unique_name     TEXT NOT NULL,
    enchant_level        SMALLINT NOT NULL DEFAULT 0,
    material_unique_name TEXT NOT NULL REFERENCES items(unique_name),
    count                INTEGER NOT NULL CHECK (count > 0),
    PRIMARY KEY (item_unique_name, enchant_level, material_unique_name),
    FOREIGN KEY (item_unique_name, enchant_level)
        REFERENCES crafting_recipes(item_unique_name, enchant_level)
);

-- Query ngược: nguyên liệu Y được dùng để craft món nào.
CREATE INDEX IF NOT EXISTS idx_crafting_materials_lookup
    ON crafting_recipe_materials (material_unique_name);
