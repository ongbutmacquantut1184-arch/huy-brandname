---
type: srs-flows
feature: cx-all-in-one
updated: 2026-07-31
links:
  - docs/cx-service-term-dashboard-update-plan.md
  - docs/cx-dashboard-overview-metrics-recommendation.md
  - docs/cx-all-in-one/srs/cx-all-in-one-flows.md
  - docs/cx-all-in-one/srs/cx-all-in-one-states.md
  - docs/cx-all-in-one/srs/cx-all-in-one-erd.md
  - docs/cx-all-in-one/d2-architect/system-architecture.d2
---

# CX All-in-one - Bản Tổng Hợp Diagram Hệ Thống

## 1. Phạm Vi Review

Tài liệu này gom toàn bộ sơ đồ hệ thống vào một bản để review nhanh:

| Nhóm | Nội dung |
| --- | --- |
| Luồng nghiệp vụ | Sale tạo phiếu, CS kích hoạt, tạo khách hàng, hợp đồng, dịch vụ, dashboard, hủy brandname, báo cáo, cron |
| State nghiệp vụ | Phiếu Sale, khách hàng, hợp đồng, dịch vụ, phiếu hủy brandname |
| Dữ liệu | ERD CX, hợp đồng, dịch vụ, hủy brandname, provider, activity log, config |
| Kiến trúc | Next.js app, server actions, API routes, Supabase, cron scheduler, Google Sheets sync |

Nguồn đối chiếu:

| Nguồn | Vai trò |
| --- | --- |
| `docs/cx-service-term-dashboard-update-plan.md` | Rule BA đã chốt về thời hạn hợp đồng, dịch vụ, gói, dashboard theo kênh và tải SUP |
| `docs/cx-dashboard-overview-metrics-recommendation.md` | Nhóm chỉ số dashboard tổng quan CX |
| `schema.sql` | Bảng dữ liệu, view, quan hệ chính |
| `src/lib/cx-actions.ts` | Action tạo phiếu, kích hoạt, tạo/sửa/gia hạn hợp đồng và dịch vụ, Customer 360, cron |
| `src/app/**` | Màn hình và API route thực tế |

## 2. Toàn Cảnh Hệ Thống

```mermaid
flowchart LR
  Sale[Sale tạo phiếu yêu cầu] --> Request[Phiếu Sale chờ kích hoạt]
  Request --> CS[CS bổ sung tài khoản và thông tin vận hành]
  CS --> Customer[Khách hàng]
  CS --> Contract[Hợp đồng]
  CS --> PendingService[Dịch vụ Pending theo kênh]
  PendingService --> ServiceOps[SUP bổ sung cấu hình dịch vụ]
  ServiceOps --> ActiveService[Dịch vụ Active]
  ActiveService --> Dashboard[Dashboard điều hành CX]
  Contract --> Dashboard
  Customer --> Dashboard
  ActiveService --> Renew[Gia hạn hoặc cập nhật trạng thái]
  Renew --> Contract
  Renew --> ActiveService
  CancelInput[Nhập thông tin hủy brandname] --> Cancellation[Phiếu hủy]
  Cancellation --> CancelService[Tự động Cancel dịch vụ nếu khớp Brand và CP]
  Cancellation --> ProviderReport[Báo cáo theo nhà cung cấp]
  Cancellation --> SheetSync[Đồng bộ Google Sheets]
  CancelService --> Dashboard
```

## 3. Luồng Sale Tạo Phiếu Và CS Kích Hoạt

```mermaid
sequenceDiagram
  actor Sale
  participant SaleForm as Màn hình Tạo phiếu Sale
  participant Actions as cx-actions
  participant DB as Supabase
  actor CS
  participant Requests as Màn hình Tạo tài khoản

  Sale->>SaleForm: Nhập thông tin khách hàng và dịch vụ
  SaleForm->>SaleForm: Kiểm tra email, số điện thoại, ngày hiệu lực
  SaleForm->>Actions: createPendingRequest
  Actions->>DB: Tạo cx_requests với result_customer_id rỗng
  DB-->>SaleForm: Trả mã phiếu request_id
  CS->>Requests: Tìm phiếu theo request_id
  Requests->>Actions: getRequestById
  Actions->>DB: Đọc cx_requests
  DB-->>Requests: Trả thông tin phiếu
  alt Phiếu đã kích hoạt
    Requests-->>CS: Cảnh báo không tạo lại
  else Phiếu chưa kích hoạt
    CS->>Requests: Bổ sung tài khoản, Org ID, CS, SUP
    Requests->>Actions: activateRequest
    Actions->>DB: Tạo cx_customers
    Actions->>DB: Tạo cx_contracts
    loop Mỗi kênh gửi tin
      Actions->>DB: Tạo cx_services trạng thái Pending
    end
    Actions->>DB: Cập nhật cx_requests.result_customer_id
    Actions->>DB: Ghi cx_activity_logs ACTIVATE
    DB-->>Requests: Trả customerId, contractId và số dịch vụ Pending
  end
```

## 4. Luồng Quản Lý Dịch Vụ Và Gia Hạn

```mermaid
sequenceDiagram
  actor SUP
  actor CS
  participant ServicePage as Màn hình Dịch vụ
  participant ContractPage as Màn hình Hợp đồng
  participant Actions as cx-actions
  participant DB as Supabase

  SUP->>ServicePage: Thêm hoặc sửa dịch vụ
  ServicePage->>Actions: createService hoặc updateServiceInfo
  Actions->>DB: Upsert brand và CP nếu cần
  Actions->>DB: Lưu cx_services với channel, usage_method, package_type, term_type
  Actions->>DB: Ghi activity log CREATE_SERVICE hoặc UPDATE_SERVICE
  DB-->>ServicePage: Trả kết quả lưu

  CS->>ContractPage: Gia hạn hợp đồng
  ContractPage->>Actions: renewContract type contract
  Actions->>DB: Tạo hợp đồng mới có previous_contract_id
  Actions->>DB: Clone dịch vụ từ hợp đồng cũ sang hợp đồng mới
  Actions->>DB: Chuyển hợp đồng cũ sang Expired
  Actions->>DB: Cập nhật ngày hết hạn hiện tại của khách hàng
  Actions->>DB: Ghi activity log RENEW
  DB-->>ContractPage: Trả contractId mới

  SUP->>ServicePage: Gia hạn riêng dịch vụ
  ServicePage->>Actions: renewContract type service
  Actions->>DB: Cập nhật ngay_bat_dau, ngay_het_han và trang_thai Active
  Actions->>DB: Ghi activity log RENEW
  DB-->>ServicePage: Trả serviceId đã gia hạn
```

## 5. Luồng Dashboard Điều Hành CX

```mermaid
sequenceDiagram
  actor Manager
  participant Dashboard as Màn hình Tổng quan CX
  participant CustomersPage as Tra cứu Khách hàng
  participant Actions as cx-actions
  participant DB as Supabase

  Manager->>Dashboard: Mở dashboard
  Dashboard->>Actions: getCustomersOverview
  Actions->>DB: Đọc cx_customers
  Actions->>DB: Đọc cx_contracts theo customer_id
  Actions->>DB: Đọc vw_cx_services_details theo customer_id
  DB-->>Actions: Trả customer, contract, service và effective_service_end
  Actions-->>Dashboard: Tổng hợp theo từng customer
  Dashboard->>Dashboard: Tính scorecard, bucket hết hạn, trạng thái, CS, SUP, chất lượng dữ liệu
  Manager->>Dashboard: Bấm drill-down CS hoặc SUP
  Dashboard-->>Manager: Mở drawer danh sách liên quan
  Manager->>CustomersPage: Tìm khách hàng hoặc mở Customer 360
  CustomersPage->>Actions: getCustomer360
  Actions->>DB: Đọc customer, contract, service, request, cancel log
  DB-->>CustomersPage: Trả hồ sơ 360 độ
```

## 6. Luồng Hủy Brandname Và Báo Cáo Nhà Cung Cấp

```mermaid
sequenceDiagram
  actor OperatorUser as Người nhập hủy
  participant CancelForm as Màn hình Nhập hủy
  participant CancelAPI as API cancellations
  participant ReportAPI as API reports
  participant DB as Supabase
  participant Sheets as Google Sheets Apps Script

  OperatorUser->>CancelForm: Nhập tháng, brand, CP, nhà mạng, nhà cung cấp
  CancelForm->>CancelAPI: Kiểm tra overlap theo tháng, brand và CP
  CancelAPI->>DB: Tìm phiếu hủy trùng nhà cung cấp
  alt Có overlap
    CancelAPI-->>CancelForm: Trả lỗi trùng lặp để bỏ tick
  else Không overlap
    CancelForm->>CancelAPI: Lưu phiếu hủy
    CancelAPI->>DB: Tạo cancellations
    CancelAPI->>DB: Tạo cancellation_details
    opt Brand và CP khớp service
      CancelAPI->>DB: Cập nhật cx_services sang Cancelled
      CancelAPI->>DB: Ghi cx_activity_logs CANCEL_SERVICE
    end
    CancelAPI->>Sheets: Đồng bộ create hoặc update
    CancelAPI-->>CancelForm: Trả mã phiếu hủy
  end
  OperatorUser->>ReportAPI: Xem hoặc xuất báo cáo theo tháng và provider
  ReportAPI->>DB: Đọc cancellation_details, brand, CP, operator
  DB-->>ReportAPI: Trả dữ liệu chi tiết
  ReportAPI-->>OperatorUser: Báo cáo web, CSV hoặc Excel
```

## 7. Luồng Cron Gia Hạn Tự Động

```mermaid
sequenceDiagram
  participant Scheduler as Cron scheduler
  participant CronAPI as API cron auto-renew
  participant Actions as cx-actions
  participant DB as Supabase

  Scheduler->>CronAPI: GET với Authorization Bearer CRON_SECRET
  alt CRON_SECRET sai
    CronAPI-->>Scheduler: 401 Unauthorized
  else Hợp lệ hoặc chưa cấu hình secret
    CronAPI->>Actions: processAutoRenewContracts
    Actions->>DB: Tìm hợp đồng Active có tu_dong_gia_han và hết hạn trong 7 ngày
    loop Mỗi hợp đồng cần gia hạn
      Actions->>Actions: Tính ngày bắt đầu mới và ngày kết thúc mới
      Actions->>DB: Tạo hợp đồng mới
      Actions->>DB: Clone dịch vụ cũ sang hợp đồng mới
      Actions->>DB: Chuyển hợp đồng cũ sang Expired
      Actions->>DB: Ghi activity log RENEW
    end
    CronAPI-->>Scheduler: Trả processedCount
  end
```

## 8. State Nghiệp Vụ

### 8.1. Phiếu Sale

```mermaid
stateDiagram-v2
  [*] --> PendingRequest: Sale gửi form
  PendingRequest --> PendingRequest: CS tìm kiếm và review
  PendingRequest --> Activated: Kích hoạt thành công
  PendingRequest --> Rejected: Không tìm thấy hoặc dữ liệu không hợp lệ
  Activated --> Activated: Tìm lại sẽ báo đã tạo
  Activated --> [*]
  Rejected --> PendingRequest: Sửa dữ liệu và thử lại
```

### 8.2. Khách Hàng

```mermaid
stateDiagram-v2
  [*] --> Pending: Đã tạo nhưng chưa vận hành đầy đủ
  Pending --> Active: Tài khoản và hợp đồng sẵn sàng
  Active --> Suspended: Tạm dừng theo nghiệp vụ hoặc vận hành
  Suspended --> Active: Kích hoạt lại
  Active --> Churned: Khách rời dịch vụ
  Churned --> Active: Quay lại hoặc gia hạn
  Active --> Inactive: Không còn dịch vụ Active
  Inactive --> Active: Tạo dịch vụ mới hoặc gia hạn
```

### 8.3. Hợp Đồng

```mermaid
stateDiagram-v2
  [*] --> Active: Tạo hợp đồng
  Active --> ExpiringSoon: Ngày kết thúc nằm trong ngưỡng cảnh báo
  ExpiringSoon --> Active: Gia hạn trước khi hết hạn
  ExpiringSoon --> Expired: Đã qua ngày kết thúc
  Active --> Expired: Đóng thủ công hoặc gia hạn sang hợp đồng mới
  Active --> Cancelled: Hủy hợp đồng
  Expired --> Active: Gia hạn sang hợp đồng mới
  Cancelled --> [*]
```

### 8.4. Dịch Vụ

```mermaid
stateDiagram-v2
  [*] --> Pending: Tự động tạo từ phiếu đã kích hoạt
  Pending --> Active: SUP hoàn tất cấu hình dịch vụ
  Active --> ExpiringSoon: effective_service_end trong ngưỡng cảnh báo
  ExpiringSoon --> Active: Gia hạn dịch vụ hoặc hợp đồng
  Active --> Suspended: Tạm dừng vận hành
  Suspended --> Active: Mở lại vận hành
  Active --> Expired: Đã qua ngày kết thúc
  Expired --> Active: Gia hạn dịch vụ
  Active --> Cancelled: Phiếu hủy khớp brand và CP
  Pending --> Cancelled: Hủy trước khi kích hoạt
  Cancelled --> [*]
```

### 8.5. Phiếu Hủy Brandname

```mermaid
stateDiagram-v2
  [*] --> Draft: Người dùng nhập form hủy
  Draft --> DuplicateBlocked: Trùng tháng, brand, CP và provider
  DuplicateBlocked --> Draft: Người dùng bỏ provider bị trùng
  Draft --> Saved: Lưu phiếu hủy thành công
  Saved --> Editing: Open editId
  Editing --> ConflictBlocked: updated_at lệch hoặc bị overlap
  ConflictBlocked --> Editing: Refresh hoặc xử lý overlap
  Editing --> Saved: Cập nhật phiếu hủy thành công
  Saved --> SyncedToSheets: Đồng bộ Apps Script thành công
  Saved --> SyncSkipped: Missing GOOGLE_SCRIPT_SYNC_URL
  Saved --> SyncFailed: Lỗi Apps Script
```

## 9. ERD Tổng Hợp

```mermaid
erDiagram
  CX_REQUEST {
    string request_id PK
    string loai_yeu_cau
    string ten_cong_ty
    string loai_goi_cuoc
    string kenh_gui_tin
    date ngay_bat_dau
    date ngay_ket_thuc
    string result_customer_id
  }

  CX_CUSTOMER {
    string customer_id PK
    string request_id FK
    string trang_thai
    string org_id
    string ten_cong_ty
    string customer_success
    string customer_support
    string sale_phu_trach
  }

  CX_CONTRACT {
    string contract_id PK
    string customer_id FK
    string previous_contract_id
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
    string term_type
    string template_registration_method
    string trang_thai
    date ngay_het_han
    string sup_phu_trach
  }

  CX_ACTIVITY_LOG {
    string log_id PK
    string action
    string target_type
    string target_id
    string performed_by
    string related_customer_id
  }

  BRAND {
    string id PK
    string name
    string cp_id FK
  }

  CP {
    string id PK
    string name
  }

  OPERATOR {
    string id PK
    string name
  }

  PROVIDER {
    string id PK
    string name
    string emails
  }

  CANCELLATION {
    string id PK
    string user_id FK
    string brand_id FK
    string cp_id FK
    string month
    date enter_date
  }

  CANCELLATION_DETAIL {
    string cancellation_id FK
    string operator_id FK
    string provider_id FK
  }

  CX_REQUEST ||--o| CX_CUSTOMER : "kích hoạt thành"
  CX_CUSTOMER ||--o{ CX_CONTRACT : "có hợp đồng"
  CX_CONTRACT ||--o{ CX_SERVICE : "bao phủ dịch vụ"
  CX_CUSTOMER ||--o{ CX_SERVICE : "sử dụng dịch vụ"
  CX_CONTRACT ||--o{ CX_CONTRACT : "gia hạn từ"
  CX_CUSTOMER ||--o{ CX_ACTIVITY_LOG : "có nhật ký"
  BRAND ||--o{ CX_SERVICE : "gắn với dịch vụ"
  CP ||--o{ CX_SERVICE : "sở hữu dịch vụ"
  CP ||--o{ BRAND : "sở hữu brand"
  BRAND ||--o{ CANCELLATION : "brand bị hủy"
  CP ||--o{ CANCELLATION : "CP bị hủy"
  CANCELLATION ||--o{ CANCELLATION_DETAIL : "có chi tiết"
  OPERATOR ||--o{ CANCELLATION_DETAIL : "nhà mạng được chọn"
  PROVIDER ||--o{ CANCELLATION_DETAIL : "nhà cung cấp được chọn"
```

## 10. Kiến Trúc Hệ Thống

```d2
direction: right

users: {
  shape: person
  label: "Người dùng nội bộ"
}

browser: {
  label: "Browser"
  sale: "Form Sale"
  cs: "Kích hoạt CS"
  cx: "Quản lý CX"
  cancel: "Nhập hủy"
  report: "Báo cáo nhà cung cấp"
}

next_app: {
  label: "Next.js app"
  pages: {
    dashboard: "cx/dashboard"
    customers: "cx/customers"
    requests: "cx/requests"
    contracts: "cx/contracts"
    services: "cx/services"
    settings: "cx/settings"
    history: "cx/history"
    nhap_huy: "nhap-huy"
    tra_cuu: "tra-cuu"
    bao_cao: "bao-cao"
  }
  actions: {
    label: "Server actions"
    cx_actions: "src/lib/cx-actions.ts"
  }
  api: {
    label: "API routes"
    lookup: "api/lookup"
    cancellation: "api/cancellations"
    reports: "api/reports"
    cron: "api/cron/auto-renew"
  }
}

supabase: {
  shape: cylinder
  label: "Supabase"
  cx: "Bảng và view CX"
  cancellation: "Bảng hủy brandname"
  rpc: "RPC và index"
}

external: {
  label: "Hệ thống ngoài"
  sheets: "Google Sheets Apps Script"
  scheduler: "Cron scheduler"
}

users -> browser: "Thao tác nghiệp vụ nội bộ"
browser -> next_app.pages: "Điều hướng màn hình"
next_app.pages -> next_app.actions: "Gọi server actions"
next_app.pages -> next_app.api: "Gọi API routes"
next_app.actions -> supabase.cx: "Đọc và ghi dữ liệu CX"
next_app.actions -> supabase.rpc: "Sinh ID và tìm kiếm"
next_app.api -> supabase.cancellation: "Đọc và ghi dữ liệu hủy"
next_app.api -> supabase.cx: "Cancel dịch vụ khớp và ghi log"
external.scheduler -> next_app.api.cron: "Gọi GET theo lịch"
next_app.api.cancellation -> external.sheets: "Đồng bộ nền khi có cấu hình"
```

## 11. Business Rules Cần Review

| ID | Nội dung | Nguồn |
| --- | --- | --- |
| BR-cx-all-in-one-001 | Hợp đồng là khung hiệu lực chính của dịch vụ. | BA đã chốt |
| BR-cx-all-in-one-002 | `effective_service_end` nên dùng ngày nhỏ nhất giữa ngày kết thúc hợp đồng và ngày hết hạn dịch vụ hoặc gói. | BA đã chốt |
| BR-cx-all-in-one-003 | Dịch vụ hoặc gói vượt hạn hợp đồng cần cảnh báo, không tự động tính active hợp lệ sau hạn hợp đồng. | BA đã chốt |
| BR-cx-all-in-one-004 | Sale tạo phiếu, CS kích hoạt thành customer và contract, hệ thống sinh dịch vụ Pending theo từng kênh. | Code hiện hữu |
| BR-cx-all-in-one-005 | Phiếu đã có `result_customer_id` không được kích hoạt lại. | Code hiện hữu |
| BR-cx-all-in-one-006 | Phiếu hủy brandname bị chặn nếu trùng tháng, brand, CP, nhà cung cấp đã chọn. | Code hiện hữu |
| BR-cx-all-in-one-007 | Khi phiếu hủy match brand và CP, dịch vụ liên quan chuyển sang `Cancelled` và ghi log. | Code hiện hữu |
| BR-cx-all-in-one-008 | Dashboard không hiển thị chỉ số ảo nếu chưa có dữ liệu nguồn. | BA đã chốt |

## 12. Điểm Lệch Cần Chốt

| ID | Vấn đề | Gợi ý |
| --- | --- | --- |
| OQ-cx-all-in-one-001 | Module hủy brandname và báo cáo nhà cung cấp có liên kết sang `cx_services`, nhưng chưa nằm rõ trong tài liệu BA dashboard. | Chốt là module trong scope CX hay tách feature riêng |
| OQ-cx-all-in-one-002 | BA dùng `template_registration_method`: `customer_self_service`, `sup_manual`, `not_required`; UI hiện có `provider_approval`, `zalo_approval`, `not_required`. | Đồng bộ danh mục trước khi làm dashboard tải SUP |
| OQ-cx-all-in-one-003 | BA dùng `term_type`: `contract_bound`, `package_bound`, `technical_tracking`; UI hiện có `contract_bound`, `independent`. | Đồng bộ danh mục trước khi tính hiệu lực |
| OQ-cx-all-in-one-004 | View `vw_cx_services_details` hiện dùng `COALESCE(package_end_date, ngay_het_han, ngay_ket_thuc_hd)`, chưa lấy ngày nhỏ nhất với hợp đồng. | Sửa view để khớp rule `effective_service_end` |
| OQ-cx-all-in-one-005 | Cron auto-renew dùng `tu_dong_gia_han` và `chu_ky_gia_han`, nhưng schema gốc không thấy hai trường này. | Xác nhận migration thực tế trước khi bật cron |

## 13. Lệnh Verify Sau Khi Có Mermaid CLI

```powershell
node C:\Users\TungLD\.codex\skills\antigravity-diagram-kit\scripts\mermaid-verify.mjs --file "D:\T\Vibe code\CX_All-in-one\docs\cx-all-in-one\cx-all-in-one-system-diagrams.md"
```
