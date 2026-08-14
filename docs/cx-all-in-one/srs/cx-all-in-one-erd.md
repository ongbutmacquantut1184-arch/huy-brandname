---
type: srs-erd
feature: cx-all-in-one
updated: 2026-07-31
links:
  - docs/cx-all-in-one/srs/cx-all-in-one-flows.md
  - schema.sql
---

# CX All-in-one ERD

## Entity Relationship Diagram

```mermaid
erDiagram
  CX_REQUEST {
    string request_id PK
    string loai_yeu_cau
    string loai_dich_vu
    string ten_cong_ty
    string loai_goi_cuoc
    string kenh_gui_tin
    date ngay_bat_dau
    date ngay_ket_thuc
    string hinh_thuc_sd
    string hinh_thuc_thanh_toan
    string result_customer_id
  }

  CX_CUSTOMER {
    string customer_id PK
    string request_id FK
    string loai_khach_hang
    string trang_thai
    string org_id
    string ten_cong_ty
    string cpid
    string cp_name
    string customer_success
    string customer_support
    string sale_phu_trach
    date ngay_het_han_hien_tai
  }

  CX_CONTRACT {
    string contract_id PK
    string customer_id FK
    string previous_contract_id
    string so_hop_dong
    string so_po
    date ngay_bat_dau_hd
    date ngay_ket_thuc_hd
    string hinh_thuc_thanh_toan
    string trang_thai
  }

  CX_SERVICE {
    string service_id PK
    string customer_id FK
    string contract_id FK
    string brand_id FK
    string cp_id FK
    string channel
    string usage_method
    string package_type
    date package_start_date
    date package_end_date
    string term_type
    string template_registration_method
    string loai_dich_vu
    string brand_name_oa
    string cp_name_code
    string trang_thai
    date ngay_bat_dau
    date ngay_het_han
    string sup_phu_trach
  }

  CX_ACTIVITY_LOG {
    string log_id PK
    datetime created_at
    string action
    string target_type
    string target_id
    string performed_by
    string related_customer_id
  }

  CX_CONFIG {
    string key PK
    string value
    string description
  }

  USER {
    string id PK
    string name
  }

  OWNER {
    string id PK
    string name
  }

  CP {
    string id PK
    string name
  }

  BRAND {
    string id PK
    string name
    string owner_id FK
    string cp_id FK
  }

  OPERATOR {
    string id PK
    string name
    int order_index
  }

  PROVIDER {
    string id PK
    string name
    string emails
  }

  OPERATOR_PROVIDER_MAP {
    string operator_id FK
    string provider_id FK
  }

  CANCELLATION {
    string id PK
    string user_id FK
    string brand_id FK
    string cp_id FK
    string month
    date enter_date
    string note
  }

  CANCELLATION_DETAIL {
    string cancellation_id FK
    string operator_id FK
    string provider_id FK
  }

  CX_REQUEST ||--o| CX_CUSTOMER : "activates into"
  CX_CUSTOMER ||--o{ CX_CONTRACT : "has contracts"
  CX_CONTRACT ||--o{ CX_SERVICE : "covers services"
  CX_CUSTOMER ||--o{ CX_SERVICE : "uses services"
  CX_CONTRACT ||--o{ CX_CONTRACT : "renews from"
  CX_CUSTOMER ||--o{ CX_ACTIVITY_LOG : "has logs"
  BRAND ||--o{ CX_SERVICE : "labels service"
  CP ||--o{ CX_SERVICE : "owns service"
  OWNER ||--o{ BRAND : "owns brand"
  CP ||--o{ BRAND : "owns brand"
  USER ||--o{ CANCELLATION : "enters"
  BRAND ||--o{ CANCELLATION : "cancelled brand"
  CP ||--o{ CANCELLATION : "cancelled CP"
  CANCELLATION ||--o{ CANCELLATION_DETAIL : "has details"
  OPERATOR ||--o{ CANCELLATION_DETAIL : "selected operator"
  PROVIDER ||--o{ CANCELLATION_DETAIL : "selected provider"
  OPERATOR ||--o{ OPERATOR_PROVIDER_MAP : "maps provider"
  PROVIDER ||--o{ OPERATOR_PROVIDER_MAP : "maps operator"
```

## Derived Views And Business Meaning

| View hoặc cấu trúc | Vai trò |
| --- | --- |
| `vw_cx_services_details` | Gộp dịch vụ với hợp đồng để dashboard lấy `ngay_ket_thuc_hd` và `effective_service_end` |
| `search_customers_fast` | RPC tìm nhanh theo khách hàng và dịch vụ |
| `cx_config` | Danh mục dropdown động cho UI CX |
| `operator_provider_map` | Cấu hình nhà mạng và nhà cung cấp dùng cho form hủy |

## Review Notes

| Chủ đề | Ghi chú |
| --- | --- |
| Quan hệ request và customer | DB có `cx_customers.request_id` trỏ về request, còn `cx_requests.result_customer_id` lưu kết quả kích hoạt. |
| Quan hệ service và hợp đồng | Service có thể thiếu `contract_id`, dashboard đang dùng nhóm này làm cảnh báo chất lượng dữ liệu. |
| Brand và CP dùng chung | Module hủy brandname và module dịch vụ cùng dùng `brands` và `cps`, nên có liên kết nghiệp vụ giữa hủy và trạng thái service. |
| Activity log | Đang là bảng nhật ký chung cho activation, create, update, renew và cancel service. |
| Config | Danh mục nghiệp vụ nhiều nơi lấy từ `cx_config`, fallback nằm trong `src/lib/constants.ts`. |
