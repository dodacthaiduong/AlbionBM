#!/usr/bin/env python3
"""
Extract crafting recipes from items.json → crafting_recipes.tsv + crafting_materials.tsv
Usage: python3 06_extract_crafting.py
Then: \\copy crafting_recipes FROM 'crafting_recipes.tsv' WITH (FORMAT text)
      \\copy crafting_recipe_materials FROM 'crafting_materials.tsv' WITH (FORMAT text)
"""

import json
import csv
import sys

CATEGORIES_WITH_CRAFT = [
    'equipmentitem', 'weapon', 'mount', 'furnitureitem',
    'transformationweapon', 'crystalleagueitem', 'siegebanner',
    'trackingitem', 'farmableitem', 'consumablefrominventoryitem',
    'journalitem',
]


def ensure_list(val):
    if val is None:
        return []
    if isinstance(val, list):
        return val
    return [val]


def extract_resources(cr, valid_items):
    """Extract list of (unique_name, count) from craftingrequirements."""
    if cr is None:
        return []
    raw = cr.get('craftresource')
    resources = []
    for r in ensure_list(raw):
        name = r.get('@uniquename')
        count = int(r.get('@count', 1))
        if name and name in valid_items:
            resources.append((name, count))
    return resources


def load_valid_items(path='items_data.tsv'):
    """Danh sách unique_name có trong bảng items (nguồn load DB)."""
    names = set()
    with open(path, encoding='utf-8') as f:
        for row in csv.reader(f, delimiter='\t'):
            if row and row[0]:
                names.add(row[0])
    return names


def main():
    valid_items = load_valid_items()

    with open('items.json', encoding='utf-8') as f:
        data = json.load(f)

    items_data = data['items']

    recipes = []       # (item_unique_name, enchant_level, time, silver, crafting_focus)
    materials = []     # (item_unique_name, enchant_level, material_unique_name, count)
    seen = set()

    for cat in CATEGORIES_WITH_CRAFT:
        raw_list = items_data.get(cat, [])
        for item in ensure_list(raw_list):
            unique_name = item.get('@uniquename')
            if not unique_name or unique_name not in valid_items:
                continue

            # --- Base recipe (enchant 0) ---
            cr = item.get('craftingrequirements')
            if isinstance(cr, list):
                cr = cr[0] if cr else None
            if cr:
                key = (unique_name, 0)
                if key not in seen:
                    seen.add(key)
                    silver = int(float(cr.get('@silver', 0)))
                    craft_time = float(cr.get('@time', 0))
                    focus = int(float(cr.get('@craftingfocus', 0)))
                    recipes.append((unique_name, 0, craft_time, silver, focus))
                    for mat_name, mat_count in extract_resources(cr, valid_items):
                        materials.append((unique_name, 0, mat_name, mat_count))

            # --- Enchantment recipes ---
            enchantments = item.get('enchantments')
            if enchantments:
                enc_list = ensure_list(enchantments.get('enchantment'))
                for enc in enc_list:
                    el = int(enc.get('@enchantmentlevel', 0))
                    if el < 1 or el > 4:
                        continue
                    ecr = enc.get('craftingrequirements')
                    if isinstance(ecr, list):
                        ecr = ecr[0] if ecr else None
                    if not ecr:
                        continue
                    key = (unique_name, el)
                    if key in seen:
                        continue
                    seen.add(key)
                    silver = int(float(ecr.get('@silver', 0)))
                    craft_time = float(ecr.get('@time', 0))
                    focus = int(float(ecr.get('@craftingfocus', 0)))
                    recipes.append((unique_name, el, craft_time, silver, focus))
                    for mat_name, mat_count in extract_resources(ecr, valid_items):
                        materials.append((unique_name, el, mat_name, mat_count))

    # Write recipes TSV
    with open('crafting_recipes.tsv', 'w', newline='') as f:
        w = csv.writer(f, delimiter='\t')
        for row in recipes:
            w.writerow(row)

    # Write materials TSV
    with open('crafting_materials.tsv', 'w', newline='') as f:
        w = csv.writer(f, delimiter='\t')
        for row in materials:
            w.writerow(row)

    print(f"Recipes: {len(recipes)}")
    print(f"Materials: {len(materials)}")
    print("→ crafting_recipes.tsv")
    print("→ crafting_materials.tsv")


if __name__ == '__main__':
    main()
