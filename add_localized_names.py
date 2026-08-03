#!/usr/bin/env python3
"""
add_localized_names.py

Thêm cột `localized_names` (JSONB) vào bảng `items` và cập nhật giá trị
bằng cách map `UniqueName` trong formatted_items.json với `unique_name`
trong bảng items.

Yêu cầu:
    pip install psycopg2-binary

Cấu hình kết nối qua biến môi trường (khuyến nghị) hoặc sửa DB_CONFIG bên dưới:
    PGHOST, PGPORT, PGDATABASE, PGUSER, PGPASSWORD

Cách chạy:
    python3 add_localized_names.py /path/to/formatted_items.json
"""
import json
import sys
import os
import psycopg2
from psycopg2.extras import execute_values

DB_CONFIG = {
    "host": os.environ.get("PGHOST", "localhost"),
    "port": os.environ.get("PGPORT", "5432"),
    "dbname": os.environ.get("PGDATABASE", "albionBM"),
    "user": os.environ.get("PGUSER", "durond"),
    "password": os.environ.get("PGPASSWORD", ""),  # nên set qua biến môi trường, không hardcode
}


def load_localization(path):
    with open(path, encoding="utf-8") as f:
        data = json.load(f)

    mapping = {}
    skipped_no_name = 0
    skipped_no_names = 0

    for entry in data:
        unique_name = entry.get("UniqueName")
        if not unique_name:
            skipped_no_name += 1
            continue
        localized_names = entry.get("LocalizedNames")
        if not localized_names:
            skipped_no_names += 1
            continue
        mapping[unique_name] = json.dumps(localized_names, ensure_ascii=False)

    print(f"Đọc {len(data)} entry từ file localization.")
    print(f"  -> {len(mapping)} entry có UniqueName + LocalizedNames hợp lệ.")
    print(f"  -> Bỏ qua {skipped_no_name} entry thiếu UniqueName.")
    print(f"  -> Bỏ qua {skipped_no_names} entry thiếu LocalizedNames.")
    return mapping


def main():
    if len(sys.argv) != 2:
        print("Usage: python3 add_localized_names.py <path/to/formatted_items.json>")
        sys.exit(1)

    json_path = sys.argv[1]
    mapping = load_localization(json_path)

    conn = psycopg2.connect(**DB_CONFIG)
    try:
        with conn:
            with conn.cursor() as cur:
                # 1. Thêm cột nếu chưa tồn tại (an toàn để chạy lại nhiều lần)
                cur.execute(
                    "ALTER TABLE items ADD COLUMN IF NOT EXISTS localized_names JSONB;"
                )
                print("Đã đảm bảo cột localized_names tồn tại.")

                # 2. Update hàng loạt bằng execute_values + bảng tạm,
                #    nhanh hơn nhiều so với update từng dòng bằng loop.
                rows = [(name, val) for name, val in mapping.items()]

                execute_values(
                    cur,
                    """
                    UPDATE items AS i
                    SET localized_names = v.localized_names::jsonb
                    FROM (VALUES %s) AS v(unique_name, localized_names)
                    WHERE i.unique_name = v.unique_name
                    """,
                    rows,
                    template="(%s, %s)",
                )
                updated = cur.rowcount
                print(f"Đã update {updated} dòng trong bảng items.")

                # 3. Thống kê nhanh sau khi update
                cur.execute("SELECT count(*) FROM items WHERE localized_names IS NOT NULL;")
                total_with_localization = cur.fetchone()[0]
                cur.execute("SELECT count(*) FROM items;")
                total_items = cur.fetchone()[0]
                print(
                    f"Tổng kết: {total_with_localization}/{total_items} item "
                    f"trong bảng có localized_names."
                )
    finally:
        conn.close()


if __name__ == "__main__":
    main()
