# AlbionBM

Web tra cứu giá & tìm cơ hội flip (chênh lệch giá) vật phẩm Albion Online, tổng hợp dữ liệu từ Albion Online API theo 3 server: Asia, America, Europe.

## Kiến trúc

- **client/** — React + Vite (SPA). Dùng Bootstrap, React Router, Axios.
- **server/** — Express + PostgreSQL (pg). Proxy trung gian gọi Albion Online API, lưu dữ liệu vào DB.
- **SQL root** — Script khởi tạo & nạp dữ liệu DB.

## Yêu cầu

- Node.js 18+
- PostgreSQL 14+
- npm

## Setup cơ bản

### 1. Cài dependencies

```bash
npm --prefix server install
npm --prefix client install
```

### 2. Cấu hình biến môi trường

```bash
cp server/.env.example server/.env
cp client/.env.example client/.env
```

Sửa `server/.env` — bắt buộc điền PostgreSQL:

```env
PG_DATABASE=albionBM
PG_USER=ten_user_postgres_cua_ban
PG_PASSWORD=mat_khau_postgres_cua_ban
```

> Lưu ý an toàn:
> - `PG_PASSWORD` và mọi secret chỉ nằm trong `server/.env`, **không bao giờ** đưa vào `VITE_*` (chúng lộ ra trình duyệt).
> - `server/.env` và `client/.env` đã nằm trong `.gitignore`, không commit.

### 3. Tạo database & schema

`01_schema.sql` đã đủ cho DB mới. `05_price_history_daily.sql` thay thế bảng history cũ bằng dạng lưu theo ngày (khớp code hiện tại).

```bash
createdb albionBM
psql -d albionBM -f 01_schema.sql
psql -d albionBM -f 05_price_history_daily.sql
```

> `03_price_update.sql` và `04_black_market.sql` chỉ là migration cho DB đã có trước đó (thêm cột `server`, thêm thành phố `Black Market`). Setup mới từ đầu **không cần** chạy chúng.

### 4. Nạp dữ liệu vật phẩm

Chạy `02_load.sql` từ `psql` bằng đường dẫn tuyệt đối tới file `items_data.tsv`:

```bash
psql -d albionBM -c "\copy items (unique_name, item_type, tier, weight, shop_category, shop_subcategory1, shop_subcategory2, shop_subcategory3, item_power, attributes) FROM '/duong/dan/tuyet/doi/items_data.tsv' WITH (FORMAT text)"
```

### 5. Chạy dev

```bash
npm --prefix server run dev   # backend, mặc định http://localhost:3001
npm --prefix client run dev   # frontend, mặc định http://localhost:5173
```

Mở trình duyệt tại `http://localhost:5173`. Vite proxy `/api` về backend qua biến `VITE_DEV_API_PROXY_TARGET`.

## Nạp dữ liệu giá

Chạy lệnh cập nhật giá theo server (mặc định `asia`):

```bash
curl -X POST http://localhost:3001/api/prices/update-all
curl -X POST -H "Content-Type: application/json" -d '{"server":"europe"}' http://localhost:3001/api/prices/update-all
```

Kiểm tra trạng thái job:

```bash
curl http://localhost:3001/api/prices/update-all
```

## API endpoints

| Method | Endpoint | Mô tả |
|--------|----------|-------|
| GET | `/api/hello` | Kiểm tra backend |
| GET | `/api/items` | Danh sách vật phẩm |
| GET | `/api/items/filter-options` | Option lọc cho shop |
| GET | `/api/items/:uniqueName` | Chi tiết vật phẩm |
| GET | `/api/prices/current` | Giá hiện tại (theo server, có filter/phân trang) |
| GET | `/api/prices/flip` | Cơ hội flip giá |
| POST | `/api/prices/update-all` | Khởi động cập nhật giá (body `{"server": ...}`) |
| GET | `/api/prices/update-all` | Job cập nhật gần nhất |
| GET | `/api/prices/update-all/:jobId` | Trạng thái một job |

Filter `GET /api/prices/current`: `?server=&city=&enchant=&tier=&quality=&page=&limit=`

## Build production

```bash
npm --prefix client run build
```

`VITE_*` được nhúng vào lúc build nên **phải rebuild client** sau khi đổi chúng. Endpoint API production cấu hình qua `VITE_API_BASE_URL` tại thời điểm build.

## Test

```bash
npm --prefix server test
```
