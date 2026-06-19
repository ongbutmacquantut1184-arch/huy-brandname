# Báo cáo review code và phương án xử lý

Ngày lập: 18/06/2026  
Dự án: `CX_All-in-one`  
Phạm vi: Review logic, thuật toán, hiệu năng, bảo mật dữ liệu, tính đúng đắn của workflow và riêng luồng Tra cứu khách hàng.

## 1. Tóm tắt điều hành

Dự án hiện build được bằng `npm run build`, nhưng build đang bỏ qua kiểm tra TypeScript thông qua `ignoreBuildErrors: true`. Khi kiểm tra sâu hơn, có nhiều rủi ro quan trọng:

- Một số workflow có thể ghi dữ liệu sai hoặc nửa chừng vì không có transaction.
- Auto-renew có lỗi payload nghiêm trọng, có thể tạo hợp đồng gia hạn sai.
- API cron public, chưa có bảo vệ bằng secret.
- Supabase đang dùng anon key và schema disable RLS toàn bộ.
- Có dữ liệu nhạy cảm như mật khẩu/tài khoản khách hàng được lưu và hiển thị plaintext.
- Luồng Tra cứu khách hàng đang tải toàn bộ dữ liệu lên browser rồi lọc local, phù hợp dữ liệu nhỏ nhưng không bền khi dữ liệu tăng.

Khuyến nghị ưu tiên:

1. Khóa API cron và sửa auto-renew.
2. Bật lại TypeScript validation, xử lý lỗi type/lint quan trọng.
3. Chuyển workflow ghi nhiều bảng sang Postgres RPC/transaction.
4. Thiết kế lại RLS/auth và DTO trả về cho client.
5. Tối ưu Tra cứu khách hàng bằng database-side search, tốt nhất là RPC + trigram index.

## 2. Kết quả kiểm tra kỹ thuật

### 2.1. Build

Lệnh:

```bash
npm run build
```

Kết quả: Thành công.

Ghi nhận:

- Next.js build bỏ qua type validation vì `next.config.ts` có:

```ts
typescript: {
  ignoreBuildErrors: true,
}
```

- Có cảnh báo Next.js suy luận workspace root không chắc đúng vì phát hiện nhiều lockfile.

### 2.2. TypeScript

Lệnh:

```bash
npx tsc --noEmit
```

Kết quả: Fail.

Nhóm lỗi chính:

- Dữ liệu có thể `undefined` nhưng đưa thẳng vào state.
- Index object bằng string chưa có type an toàn.
- So sánh state modal với giá trị không tồn tại, ví dụ `activeModal === 'view'`.
- CSS property sai: `paddingOver`.
- File test import module không tồn tại.

### 2.3. Lint

Lệnh:

```bash
npm run lint
```

Kết quả: Timeout sau khoảng 122s nhưng đã phát hiện lỗi.

Nhóm lỗi chính:

- Hook gọi hàm trước khi hàm được khai báo theo rule React compiler/lint mới.
- Một số file test bị đọc như binary.
- Repo có nhiều file backup/recovered/test nằm trong scope lint.

## 3. Danh sách vấn đề và phương án xử lý

### P0-01. Auto-renew thiếu payload bắt buộc

Vị trí:

- `src/lib/cx-actions.ts`, hàm `processAutoRenewContracts()`
- `src/lib/cx-actions.ts`, hàm `renewContract()`

Hiện trạng:

`processAutoRenewContracts()` gọi `renewContract(payload)` với payload:

```ts
{
  type: 'contract',
  contractId: c.contract_id,
  ngayBatDauMoi,
  ngayKetThucMoi,
  actorEmail,
  tuDongGiaHan,
  chuKyGiaHan
}
```

Trong khi `renewContract()` cần:

- `customerId`
- `contractIdCu`
- `ngayBatDauMoi`
- `ngayKetThucMoi`

Tác động:

- Có thể sinh `CTR-undefined-*`.
- Không clone service cũ.
- Không expire hợp đồng cũ.
- Có thể fail FK hoặc tạo dữ liệu sai.

Phương án xử lý:

1. Sửa payload:

```ts
const payload = {
  type: 'contract',
  customerId: c.customer_id,
  contractIdCu: c.contract_id,
  ngayBatDauMoi: newStartIso,
  ngayKetThucMoi: newEndIso,
  actorEmail: 'system_auto_renew',
  tuDongGiaHan: true,
  chuKyGiaHan: chuKy,
};
```

2. Thêm validate đầu vào trong `renewContract()`:

- Nếu `type === 'contract'` thì bắt buộc có `customerId`, `contractIdCu`, `ngayBatDauMoi`, `ngayKetThucMoi`.
- Nếu thiếu thì return lỗi rõ ràng, không insert.

3. Test bằng case:

- Hợp đồng active có auto-renew.
- Hợp đồng có service cũ.
- Hợp đồng không có service cũ.
- Hợp đồng đã expired không được renew lại.

Ưu tiên: Làm ngay.

---

### P0-02. API cron auto-renew chưa có authentication

Vị trí:

- `src/app/api/cron/auto-renew/route.ts`

Hiện trạng:

Route GET đang public. Trong code chỉ có comment gợi ý kiểm tra secret nhưng chưa thực hiện.

Tác động:

- Bất kỳ ai biết URL có thể gọi auto-renew.
- Có thể tạo hợp đồng mới hàng loạt hoặc gây lệch dữ liệu.

Phương án xử lý:

1. Thêm biến môi trường:

```env
CRON_SECRET=...
```

2. Kiểm tra header:

```ts
const authHeader = request.headers.get('authorization');
if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
}
```

3. Chỉ cấu hình scheduler gửi đúng header.

4. Log lại số bản ghi xử lý và lỗi từng bản ghi.

Ưu tiên: Làm ngay.

---

### P0-03. Supabase RLS bị tắt toàn bộ, app dùng anon key

Vị trí:

- `schema.sql`
- `src/lib/supabase.ts`

Hiện trạng:

Schema đang `DISABLE ROW LEVEL SECURITY` cho toàn bộ bảng. App dùng:

```ts
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
```

Tác động:

- Nếu Supabase policy mở, client hoặc người ngoài có thể đọc/ghi dữ liệu.
- Email trong localStorage không phải xác thực thật.
- Server actions không đủ thay thế cho RLS nếu client vẫn có anon key và bảng mở.

Phương án xử lý:

1. Bật RLS cho các bảng nghiệp vụ.

2. Thiết kế policy theo vai trò:

- Admin: full read/write.
- Sale: tạo request, xem request của mình.
- CS/SUP: xem/sửa khách hàng/dịch vụ được phân công.
- Viewer: read-only dữ liệu không nhạy cảm.

3. Chuyển mutation quan trọng qua server-side Supabase client dùng service role, nhưng chỉ sau khi có auth/authorization ở API.

4. Không trả field nhạy cảm ra client mặc định.

Ưu tiên: Rất cao.

---

### P0-04. Dữ liệu nhạy cảm được lưu và hiển thị plaintext

Vị trí:

- `src/lib/cx-actions.ts`
- `src/components/Customer360Drawer.tsx`
- `src/app/cx/customers/page.tsx`

Hiện trạng:

Các trường như `ten_tai_khoan`, `mat_khau`, email, số điện thoại được lưu trong `cx_customers` và hiển thị trực tiếp.

Tác động:

- Rủi ro lộ thông tin đăng nhập khách hàng.
- Không có kiểm soát ai được xem mật khẩu.
- Không có audit access khi xem dữ liệu nhạy cảm.

Phương án xử lý:

1. Không lưu mật khẩu plaintext nếu không thật sự bắt buộc.

2. Nếu phải lưu credential bàn giao:

- Mã hóa ở server.
- Chỉ giải mã khi user có quyền.
- Log lại hành động xem.
- Mask mặc định trên UI, ví dụ `••••••`.

3. Tách DTO:

- Danh sách khách hàng không trả `mat_khau`.
- Customer 360 chỉ trả field nhạy cảm theo quyền.

Ưu tiên: Rất cao.

---

### P1-01. Sinh ID bằng "max + 1" không an toàn concurrency

Vị trí:

- `generateMonthlyId()`
- `generateCustomerId()`
- `generateContractId()`
- `generateServiceId()`
- API tạo cancellation ID

Hiện trạng:

Code đọc ID lớn nhất rồi cộng 1.

Tác động:

- Hai user lưu cùng lúc có thể tạo cùng ID.
- `generateServiceId()` chỉ tới phút, tạo nhiều service trong cùng phút có thể trùng.

Phương án xử lý:

1. Dùng Postgres sequence cho số tăng.

2. Hoặc dùng bảng counter + transaction/RPC:

```sql
create table id_counters (
  scope text primary key,
  current_value bigint not null
);
```

3. Hoặc dùng UUID làm primary key, display ID là mã nghiệp vụ sinh riêng.

4. Với service ID, thêm seconds/milliseconds vẫn chưa đủ an toàn bằng sequence/UUID.

Ưu tiên: Cao.

---

### P1-02. Workflow nhiều bước không có transaction

Vị trí:

- `activateRequest()`
- `renewContract()`
- `createContractWithServices()`
- API `POST /api/cancellations`
- API `PUT /api/cancellations`

Hiện trạng:

Các workflow insert/update nhiều bảng bằng nhiều request Supabase riêng lẻ.

Tác động:

- Nếu lỗi giữa chừng, dữ liệu có thể nửa mới nửa cũ.
- Rollback thủ công hiện chưa đủ, ví dụ PUT cancellation update header rồi delete details, insert details lỗi thì mất chi tiết cũ.

Phương án xử lý:

1. Chuyển workflow sang Postgres function/RPC.

2. Trong RPC dùng transaction mặc định của function để:

- Validate input.
- Sinh ID.
- Insert/update nhiều bảng.
- Insert activity log.
- Return kết quả.

3. Với sync Google Sheets, chỉ chạy sau khi transaction thành công.

Ưu tiên: Cao.

---

### P1-03. Schema và code lệch nhau

Vị trí:

- `schema.sql`
- `src/lib/cx-actions.ts`
- `src/app/cx/contracts/page.tsx`

Hiện trạng:

Code dùng `tu_dong_gia_han`, `chu_ky_gia_han` nhưng `schema.sql` không có hai cột này trong `cx_contracts`.

Code select `sale_in_charge`, `cs_in_charge`, nhưng schema có `sale_phu_trach`, `customer_success`, `customer_support`.

Tác động:

- Runtime query có thể fail.
- UI có fallback lẫn lộn field cũ/mới.
- Khó bảo trì và debug.

Phương án xử lý:

1. Chốt schema thật đang chạy trên Supabase.

2. Cập nhật `schema.sql` thành nguồn chuẩn.

3. Viết migration bổ sung hoặc đổi code về đúng field.

4. Tạo type database từ Supabase nếu có thể.

Ưu tiên: Cao.

---

### P1-04. TypeScript bị vô hiệu hóa trong build

Vị trí:

- `next.config.ts`

Hiện trạng:

`ignoreBuildErrors: true`.

Tác động:

- Build pass dù có lỗi type thật.
- Dễ đưa lỗi runtime lên production.

Phương án xử lý:

1. Sửa lỗi TypeScript hiện có.

2. Bỏ `ignoreBuildErrors`.

3. Thêm lệnh CI:

```bash
npm run lint
npx tsc --noEmit
npm run build
```

Ưu tiên: Cao.

---

### P1-05. Lint bị nhiễu bởi file backup/test/recovered

Vị trí:

- Root project
- `src/app/cx/contracts/*.recovered`
- `*.backup_write`
- `test_search.*`

Hiện trạng:

Nhiều file tạm/backup nằm trong scope lint/typecheck.

Tác động:

- Lint chậm, khó đọc kết quả.
- TypeScript bắt cả file thử nghiệm.
- Dễ deploy nhầm artifact không cần thiết.

Phương án xử lý:

1. Di chuyển file backup/recovered ra thư mục `archive/` hoặc `tools/recovery/`.

2. Cấu hình `.eslintignore` hoặc `eslint.config.mjs` ignore rõ.

3. Cấu hình `tsconfig.exclude` cho script thử nghiệm không thuộc app.

4. Chỉ giữ source chính trong `src`.

Ưu tiên: Trung bình cao.

---

## 4. Review riêng logic Tra cứu khách hàng

### 4.1. Hiện trạng luồng tìm kiếm

Vị trí:

- `src/app/cx/customers/page.tsx`
- `src/lib/cx-actions.ts`

Khi mở màn Tra cứu khách hàng:

1. Component gọi `fetchData()`.
2. `fetchData()` gọi `getCustomersOverview()` và `getDropdownConfigs()`.
3. `getCustomersOverview()` lấy toàn bộ `cx_customers`.
4. Sau đó lấy contracts/services theo toàn bộ customer IDs.
5. Server action map lại dữ liệu và trả toàn bộ danh sách về browser.
6. Khi user gõ search, browser lọc local bằng `customers.filter(...)`.

Logic search hiện tại:

- Search theo customer:
  - `customer_id`
  - `ten_cong_ty`
  - `org_id`
  - `cpid`
  - `cp_name`

- Search theo service:
  - `brand_name_oa`
  - `cp_name_code`
  - `service_id`

Debounce: 400ms.

### 4.2. Vấn đề hiệu năng

#### Vấn đề 1: Tải toàn bộ dữ liệu ban đầu

`getCustomersOverview()` dùng `select('*')` với `cx_customers`, sau đó load contract/service cho toàn bộ customer.

Tác động:

- Tốn network.
- Tốn RAM browser.
- Lộ field không cần thiết.
- Load đầu trang chậm khi dữ liệu lớn.

#### Vấn đề 2: Thuật toán map dữ liệu chưa tối ưu

Hiện code map mỗi customer bằng cách filter toàn bộ `contracts` và `services`.

Độ phức tạp:

```text
O(customers * contracts + customers * services)
```

Nếu có 10.000 customers và 50.000 services, chi phí rất lớn.

#### Vấn đề 3: Search local scan toàn bộ mảng sau mỗi lần gõ

Mỗi lần debounce chạy:

```text
customers.filter(...)
  services.some(...)
```

Độ phức tạp gần:

```text
O(customers * average_services_per_customer)
```

#### Vấn đề 4: Hàm server search tồn tại nhưng không được dùng

`searchCustomers()` đang được import nhưng không gọi trong UI.

Nếu chuyển sang dùng ngay hàm này cũng chưa tối ưu vì:

- Chạy 8 query `ilike('%keyword%')`.
- Query có thể scan bảng nếu chưa có trigram index.
- Sau đó vẫn `select('*')` cho customer.

### 4.3. Phương án xử lý cho Tra cứu khách hàng

#### Phương án A: Tối ưu nhẹ, ít rủi ro

Phù hợp khi dữ liệu còn nhỏ hoặc cần cải thiện nhanh.

Cách xử lý:

1. Trong `getCustomersOverview()`, tạo map:

```ts
const contractsByCustomer = new Map<string, any[]>();
const servicesByCustomer = new Map<string, any[]>();
```

2. Khi map customer, lấy dữ liệu bằng map thay vì `.filter()` nhiều lần.

3. Không dùng `select('*')`; chỉ select field cần hiển thị.

4. Tạo `searchText` cho mỗi customer:

```ts
searchText = [
  customer_id,
  ten_cong_ty,
  org_id,
  cpid,
  cp_name,
  ...service brand/cp/service_id
].join(' ').toLowerCase()
```

5. Search local chỉ còn:

```ts
customers.filter(c => c.searchText.includes(q)).slice(0, 20)
```

Ưu điểm:

- Ít thay đổi kiến trúc.
- Cải thiện rõ CPU server/client.
- Không cần migration DB.

Nhược điểm:

- Vẫn tải toàn bộ dữ liệu về browser.
- Không bền nếu dữ liệu tăng lớn.

Mức ưu tiên: Có thể làm ngay.

---

#### Phương án B: Server-side search bằng action/API hiện có

Phù hợp khi muốn giảm tải browser nhưng chưa muốn viết SQL RPC.

Cách xử lý:

1. UI gọi `searchCustomers(query)` khi user gõ.

2. `getCustomersOverview()` chỉ phục vụ bảng tổng quan, nên có pagination hoặc giới hạn page đầu.

3. `searchCustomers()` trả DTO gọn:

```ts
{
  customer_id,
  ten_cong_ty,
  org_id,
  cpid,
  cp_name,
  customer_success,
  sale_phu_trach,
  matched_services
}
```

4. Bỏ `select('*')`.

5. Thêm limit và scoring đơn giản:

- Match exact customer_id ưu tiên cao nhất.
- Prefix match ưu tiên tiếp.
- Match company/service đứng sau.

Ưu điểm:

- Không cần tải toàn bộ data để search.
- Browser nhẹ hơn.
- Dễ triển khai hơn RPC.

Nhược điểm:

- Nếu vẫn dùng `ILIKE '%keyword%'` không index, DB vẫn chậm khi lớn.
- 8 query song song hiện tại nên được gom lại hoặc tối ưu.

Mức ưu tiên: Tốt cho giai đoạn chuyển tiếp.

---

#### Phương án C: RPC Postgres + trigram index

Đây là phương án khuyến nghị cân bằng nhất.

Cách xử lý:

1. Bật extension:

```sql
create extension if not exists pg_trgm;
```

2. Tạo index cho các cột search:

```sql
create index if not exists idx_cx_customers_customer_id_trgm
on cx_customers using gin (customer_id gin_trgm_ops);

create index if not exists idx_cx_customers_ten_cong_ty_trgm
on cx_customers using gin (ten_cong_ty gin_trgm_ops);

create index if not exists idx_cx_customers_org_id_trgm
on cx_customers using gin (org_id gin_trgm_ops);

create index if not exists idx_cx_customers_cpid_trgm
on cx_customers using gin (cpid gin_trgm_ops);

create index if not exists idx_cx_customers_cp_name_trgm
on cx_customers using gin (cp_name gin_trgm_ops);

create index if not exists idx_cx_services_brand_name_oa_trgm
on cx_services using gin (brand_name_oa gin_trgm_ops);

create index if not exists idx_cx_services_cp_name_code_trgm
on cx_services using gin (cp_name_code gin_trgm_ops);

create index if not exists idx_cx_services_service_id_trgm
on cx_services using gin (service_id gin_trgm_ops);
```

3. Viết function:

```sql
create or replace function search_customers_fast(q text, limit_count int default 20)
returns table (
  customer_id text,
  ten_cong_ty text,
  org_id text,
  cpid text,
  cp_name text,
  customer_success text,
  sale_phu_trach text,
  total_contracts bigint,
  total_services bigint,
  active_services bigint,
  rank_score int
)
language sql
stable
as $$
  with matched_customer as (
    select c.customer_id, 100 as score
    from cx_customers c
    where c.customer_id ilike '%' || q || '%'
       or c.ten_cong_ty ilike '%' || q || '%'
       or c.org_id ilike '%' || q || '%'
       or c.cpid ilike '%' || q || '%'
       or c.cp_name ilike '%' || q || '%'
    limit limit_count * 2
  ),
  matched_service as (
    select distinct s.customer_id, 70 as score
    from cx_services s
    where s.brand_name_oa ilike '%' || q || '%'
       or s.cp_name_code ilike '%' || q || '%'
       or s.service_id ilike '%' || q || '%'
    limit limit_count * 2
  ),
  matched as (
    select customer_id, max(score) as score
    from (
      select * from matched_customer
      union all
      select * from matched_service
    ) x
    group by customer_id
  )
  select
    c.customer_id,
    c.ten_cong_ty,
    c.org_id,
    c.cpid,
    c.cp_name,
    c.customer_success,
    c.sale_phu_trach,
    count(distinct ct.contract_id) as total_contracts,
    count(distinct s.service_id) as total_services,
    count(distinct s.service_id) filter (where s.trang_thai = 'Active') as active_services,
    m.score as rank_score
  from matched m
  join cx_customers c on c.customer_id = m.customer_id
  left join cx_contracts ct on ct.customer_id = c.customer_id
  left join cx_services s on s.customer_id = c.customer_id
  group by c.customer_id, m.score
  order by m.score desc, c.ten_cong_ty asc
  limit limit_count;
$$;
```

4. App gọi:

```ts
supabase.rpc('search_customers_fast', {
  q: query.trim(),
  limit_count: 20,
});
```

Ưu điểm:

- Search nhanh hơn nhiều khi dữ liệu lớn.
- Chỉ trả đúng 20 kết quả.
- Không cần thêm hạ tầng ngoài.
- Dễ kiểm soát field trả về.

Nhược điểm:

- Cần migration SQL.
- Cần test với tiếng Việt có dấu/không dấu.

Mức ưu tiên: Khuyến nghị triển khai.

---

#### Phương án D: Bảng search denormalized hoặc materialized view

Phù hợp nếu màn này là nghiệp vụ dùng rất thường xuyên và dữ liệu lớn.

Cách xử lý:

Tạo bảng hoặc materialized view:

```sql
cx_customer_search (
  customer_id,
  ten_cong_ty,
  org_id,
  cpid,
  cp_name,
  customer_success,
  sale_phu_trach,
  trang_thai,
  total_contracts,
  total_services,
  active_services,
  service_expiries,
  search_text
)
```

`search_text` gom:

- customer id
- tên công ty
- org id
- cpid
- cp name
- brand_name_oa
- cp_name_code
- service_id

Tạo index:

```sql
create index if not exists idx_cx_customer_search_text_trgm
on cx_customer_search using gin (search_text gin_trgm_ops);
```

Đồng bộ bằng một trong các cách:

- Trigger khi customer/service/contract thay đổi.
- Cron refresh materialized view.
- Cập nhật trong server actions sau mỗi mutation.

Ưu điểm:

- Nhanh nhất trong phạm vi Postgres.
- Query đơn giản.
- Có thể phục vụ cả search, filter, export.

Nhược điểm:

- Tăng độ phức tạp đồng bộ dữ liệu.
- Cần đảm bảo refresh không gây stale data quá lâu.

Mức ưu tiên: Làm khi dữ liệu lớn hoặc search là màn trọng tâm.

---

#### Phương án E: Search engine riêng

Công cụ có thể dùng:

- Meilisearch
- Typesense
- Algolia

Ưu điểm:

- Fuzzy search tốt.
- Ranking, typo tolerance, highlight tốt.
- Hiệu năng cao với dữ liệu lớn.

Nhược điểm:

- Thêm hạ tầng.
- Cần pipeline đồng bộ.
- Cần xử lý bảo mật dữ liệu khách hàng rất kỹ.

Mức ưu tiên: Chỉ nên cân nhắc khi Postgres search không còn đủ.

## 5. Khuyến nghị lộ trình xử lý

### Giai đoạn 1: Ổn định lỗi nghiêm trọng

1. Sửa auto-renew payload.
2. Thêm auth cho cron.
3. Bật validate đầu vào cho `renewContract()`.
4. Xóa hoặc ẩn field mật khẩu trên danh sách khách hàng.
5. Bỏ `select('*')` ở các API trả về client nếu không cần.

### Giai đoạn 2: Làm sạch chất lượng build

1. Sửa lỗi `npx tsc --noEmit`.
2. Bỏ `ignoreBuildErrors`.
3. Dọn file backup/test/recovered khỏi scope lint.
4. Sửa lỗi hook ordering.
5. Đồng bộ schema với code.

### Giai đoạn 3: Bảo toàn dữ liệu

1. Chuyển tạo request/activate/renew/cancellation sang RPC transaction.
2. Đổi cơ chế sinh ID sang sequence hoặc counter table atomic.
3. Chuẩn hóa activity log.

### Giai đoạn 4: Tối ưu Tra cứu khách hàng

1. Ngắn hạn: tối ưu `getCustomersOverview()` bằng Map và DTO gọn.
2. Trung hạn: chuyển search box sang server-side search.
3. Bền vững: tạo RPC `search_customers_fast` + trigram index.
4. Nếu dữ liệu rất lớn: dùng bảng search denormalized/materialized view.

## 6. Ma trận ưu tiên

| Mã | Vấn đề | Mức độ | Phương án khuyến nghị |
| --- | --- | --- | --- |
| P0-01 | Auto-renew thiếu `customerId`/`contractIdCu` | Rất cao | Sửa payload + validate `renewContract()` |
| P0-02 | Cron public | Rất cao | Thêm `CRON_SECRET` |
| P0-03 | RLS disabled + anon key | Rất cao | Bật RLS, auth thật, policy theo role |
| P0-04 | Mật khẩu plaintext | Rất cao | Không trả/lưu plaintext, mã hóa/mask/audit |
| P1-01 | Sinh ID `max + 1` | Cao | Sequence/RPC atomic |
| P1-02 | Không có transaction | Cao | Postgres RPC transaction |
| P1-03 | Schema lệch code | Cao | Đồng bộ schema/migration/type |
| P1-04 | Build bỏ qua TypeScript | Cao | Sửa type, bỏ `ignoreBuildErrors` |
| P1-05 | File backup/test làm nhiễu lint | Trung bình cao | Dọn/ignore file tạm |
| P2-01 | Search khách hàng lọc local toàn bộ | Trung bình cao | RPC search + trigram index |
| P2-02 | `getCustomersOverview()` map O(n*m) | Trung bình | Dùng Map, DTO gọn |

## 7. Kết luận

Phần có rủi ro nghiệp vụ lớn nhất là auto-renew, transaction và sinh ID. Phần có rủi ro bảo mật lớn nhất là RLS disabled, cron public và plaintext credential.

Riêng Tra cứu khách hàng, cách hiện tại hợp lý cho prototype hoặc dữ liệu nhỏ, nhưng không nên giữ lâu dài. Phương án cân bằng nhất là chuyển sang `search_customers_fast` RPC với trigram index, đồng thời tối ưu `getCustomersOverview()` bằng Map và DTO gọn để giảm tải ban đầu.
