#!/usr/bin/env python3
"""
Fix items.max_enchant from raw items.json game data.
If items.json not found, fall back to crafting_recipes.

Usage: python3 08_fix_max_enchant.py
"""

import json
import csv
import os
import psycopg2
from psycopg2.extras import execute_values

DB_CONFIG = {
    "host": os.environ.get("PGHOST", "localhost"),
    "port": os.environ.get("PGPORT", "5432"),
    "dbname": os.environ.get("PGDATABASE", "albionBM"),
    "user": os.environ.get("PGUSER", "durond"),
    "password": os.environ.get("PGPASSWORD", ""),
}

RAW_ITEMS_PATH = "items.json"
CRAFT_RECIPES_PATH = "crafting_recipes.tsv"

CATEGORIES_WITH_CRAFT = [
    "equipmentitem", "weapon", "mount", "furnitureitem",
    "transformationweapon", "crystalleagueitem", "siegebanner",
    "trackingitem", "farmableitem", "consumablefrominventoryitem",
    "journalitem",
]

CATEGORIES_QUALITY_5 = [
    "weapon", "equipmentitem", "mount", "transformationweapon",
    "crystalleagueitem", "siegebanner", "trackingitem",
]


def ensure_list(val):
    if val is None:
        return []
    if isinstance(val, list):
        return val
    return [val]


def extract_max_enchant_from_raw():
    """Read items.json game data to get max_enchant per item."""
    if not os.path.exists(RAW_ITEMS_PATH):
        return None

    with open(RAW_ITEMS_PATH, encoding="utf-8") as f:
        data = json.load(f)

    result = {}  # unique_name -> max_enchant

    for cat in CATEGORIES_WITH_CRAFT:
        raw_list = data["items"].get(cat, [])
        for item in ensure_list(raw_list):
            uname = item.get("@uniquename")
            if not uname:
                continue

            menc = int(item.get("@maxenchantlevel", 0))
            result[uname] = menc

    return result


def extract_max_enchant_from_recipes():
    """Fallback: derive max_enchant from crafting_recipes.tsv."""
    result = {}
    with open(CRAFT_RECIPES_PATH, newline="", encoding="utf-8") as f:
        reader = csv.reader(f, delimiter="\t")
        for row in reader:
            name = row[0]
            enchant = int(row[1])
            if name not in result or enchant > result[name]:
                result[name] = enchant
    return result


def extract_max_quality():
    """Derive max_quality from crafting_recipes - craftable gear = 5, rest = 1."""
    craftable = set()
    with open(CRAFT_RECIPES_PATH, newline="", encoding="utf-8") as f:
        reader = csv.reader(f, delimiter="\t")
        for row in reader:
            craftable.add(row[0])

    return craftable


def main():
    menc = extract_max_enchant_from_raw()
    if menc is None:
        print("items.json not found, fallback to crafting_recipes.tsv")
        menc = extract_max_enchant_from_recipes()
        print(f"Loaded {len(menc)} items from crafting_recipes")
    else:
        print(f"Loaded {len(menc)} items from items.json")

    craftable = extract_max_quality()

    conn = psycopg2.connect(**DB_CONFIG)
    try:
        with conn:
            with conn.cursor() as cur:
                # Update max_enchant
                rows = [(v, k) for k, v in menc.items()]
                execute_values(
                    cur,
                    """
                    UPDATE items AS i
                    SET max_enchant = v.max_enchant
                    FROM (VALUES %s) AS v(max_enchant, unique_name)
                    WHERE i.unique_name = v.unique_name
                    """,
                    rows,
                    template="(%s::smallint, %s)",
                )
                updated_enc = cur.rowcount
                print(f"Updated max_enchant: {updated_enc} rows")

                # Update max_quality to 5 for craftable gear
                execute_values(
                    cur,
                    """
                    UPDATE items AS i
                    SET max_quality = 5
                    FROM (VALUES %s) AS v(unique_name)
                    WHERE i.unique_name = v.unique_name
                    AND i.max_quality = 1
                    """,
                    [(n,) for n in craftable],
                    template="(%s)",
                )
                updated_q = cur.rowcount
                print(f"Updated max_quality to 5: {updated_q} rows")

                # Stats
                cur.execute("SELECT max_enchant, COUNT(*) FROM items GROUP BY max_enchant ORDER BY max_enchant")
                for row in cur.fetchall():
                    print(f"  max_enchant={row[0]}: {row[1]} items")

                cur.execute("SELECT max_quality, COUNT(*) FROM items GROUP BY max_quality ORDER BY max_quality")
                for row in cur.fetchall():
                    print(f"  max_quality={row[0]}: {row[1]} items")

    finally:
        conn.close()

    print("Done. Run price update to fetch enchanted prices.")


if __name__ == "__main__":
    main()
