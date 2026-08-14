---
type: srs-flows
feature: cx-all-in-one
updated: 2026-07-31
links:
  - docs/cx-service-term-dashboard-update-plan.md
  - docs/cx-dashboard-overview-metrics-recommendation.md
---

# CX All-in-one Flows

## Source Scope

Tài liệu này vẽ lại hệ thống từ hai nguồn:

| Nhóm | Nguồn | Ghi chú review |
| --- | --- | --- |
| Nghiệp vụ đã chốt | `docs/cx-service-term-dashboard-update-plan.md` | Thời hạn hợp đồng, dịch vụ, gói, dashboard theo kênh và tải SUP |
| Dashboard đề xuất | `docs/cx-dashboard-overview-metrics-recommendation.md` | Nhóm chỉ số tổng quan, rủi ro, trạng thái, CS, SUP, chất lượng dữ liệu |
| Code và schema hiện hữu | `schema.sql`, `src/lib/cx-actions.ts`, `src/app/**` | Xác nhận module, bảng, action, API route và luồng đang có trong hệ thống |

## Flow: Toàn Cảnh Nghiệp Vụ

```mermaid
flowchart LR
  Sale[Sale tao phieu yeu cau] --> Request[Phieu Sale cho kich hoat]
  Request --> CS[CS bo sung tai khoan va thong tin van hanh]
  CS --> Customer[Khach hang]
  CS --> Contract[Hop dong]
  CS --> PendingService[Dich vu Pending theo kenh]
  PendingService --> ServiceOps[SUP bo sung cau hinh dich vu]
  ServiceOps --> ActiveService[Dich vu Active]
  ActiveService --> Dashboard[Dashboard dieu hanh CX]
  Contract --> Dashboard
  Customer --> Dashboard
  ActiveService --> Renew[Gia han hoac cap nhat trang thai]
  Renew --> Contract
  Renew --> ActiveService
  CancelInput[Nhap thong tin huy brandname] --> Cancellation[Phieu huy]
  Cancellation --> CancelService[Tu dong Cancel dich vu neu match Brand va CP]
  Cancellation --> ProviderReport[Bao cao theo nha cung cap]
  Cancellation --> SheetSync[Dong bo Google Sheets]
  CancelService --> Dashboard
```

## Flow: Sale Tạo Phiếu Và CS Kích Hoạt

```mermaid
sequenceDiagram
  actor Sale
  participant SaleForm as Man hinh Tao phieu Sale
  participant Actions as cx-actions
  participant DB as Supabase
  actor CS
  participant Requests as Man hinh Tao tai khoan

  Sale->>SaleForm: Nhap thong tin khach hang va dich vu
  SaleForm->>SaleForm: Kiem tra email, so dien thoai, ngay hieu luc
  SaleForm->>Actions: createPendingRequest
  Actions->>DB: Tao cx_requests voi result_customer_id rong
  DB-->>SaleForm: Tra ma phieu request_id
  CS->>Requests: Tim phieu theo request_id
  Requests->>Actions: getRequestById
  Actions->>DB: Doc cx_requests
  DB-->>Requests: Tra thong tin phieu
  alt Phieu da kich hoat
    Requests-->>CS: Canh bao khong tao lai
  else Phieu chua kich hoat
    CS->>Requests: Bo sung tai khoan, Org ID, CS, SUP
    Requests->>Actions: activateRequest
    Actions->>DB: Tao cx_customers
    Actions->>DB: Tao cx_contracts
    loop Moi kenh gui tin
      Actions->>DB: Tao cx_services trang thai Pending
    end
    Actions->>DB: Cap nhat cx_requests.result_customer_id
    Actions->>DB: Ghi cx_activity_logs ACTIVATE
    DB-->>Requests: Tra customerId, contractId va so dich vu Pending
  end
```

## Flow: Quản Lý Dịch Vụ Và Gia Hạn

```mermaid
sequenceDiagram
  actor SUP
  actor CS
  participant ServicePage as Man hinh Dich vu
  participant ContractPage as Man hinh Hop dong
  participant Actions as cx-actions
  participant DB as Supabase

  SUP->>ServicePage: Them hoac sua dich vu
  ServicePage->>Actions: createService hoac updateServiceInfo
  Actions->>DB: Upsert brand va CP neu can
  Actions->>DB: Luu cx_services voi channel, usage_method, package_type, term_type
  Actions->>DB: Ghi activity log CREATE_SERVICE hoac UPDATE_SERVICE
  DB-->>ServicePage: Tra ket qua luu

  CS->>ContractPage: Gia han hop dong
  ContractPage->>Actions: renewContract type contract
  Actions->>DB: Tao hop dong moi co previous_contract_id
  Actions->>DB: Clone dich vu tu hop dong cu sang hop dong moi
  Actions->>DB: Chuyen hop dong cu sang Expired
  Actions->>DB: Cap nhat ngay het han hien tai cua khach hang
  Actions->>DB: Ghi activity log RENEW
  DB-->>ContractPage: Tra contractId moi

  SUP->>ServicePage: Gia han rieng dich vu
  ServicePage->>Actions: renewContract type service
  Actions->>DB: Cap nhat ngay_bat_dau, ngay_het_han va trang_thai Active
  Actions->>DB: Ghi activity log RENEW
  DB-->>ServicePage: Tra serviceId da gia han
```

## Flow: Dashboard Điều Hành CX

```mermaid
sequenceDiagram
  actor Manager
  participant Dashboard as Man hinh Tong quan CX
  participant CustomersPage as Tra cuu Khach hang
  participant Actions as cx-actions
  participant DB as Supabase

  Manager->>Dashboard: Mo dashboard
  Dashboard->>Actions: getCustomersOverview
  Actions->>DB: Doc cx_customers
  Actions->>DB: Doc cx_contracts theo customer_id
  Actions->>DB: Doc vw_cx_services_details theo customer_id
  DB-->>Actions: Tra customer, contract, service va effective_service_end
  Actions-->>Dashboard: Tong hop per customer
  Dashboard->>Dashboard: Tinh scorecard, bucket het han, trang thai, CS, SUP, data quality
  Manager->>Dashboard: Bam drill-down CS hoac SUP
  Dashboard-->>Manager: Mo drawer danh sach lien quan
  Manager->>CustomersPage: Tim khach hang hoac mo Customer 360
  CustomersPage->>Actions: getCustomer360
  Actions->>DB: Doc customer, contract, service, request, cancel log
  DB-->>CustomersPage: Tra ho so 360 do
```

## Flow: Hủy Brandname Và Đồng Bộ Dịch Vụ

```mermaid
sequenceDiagram
  actor OperatorUser as Nguoi nhap huy
  participant CancelForm as Man hinh Nhap huy
  participant CancelAPI as API cancellations
  participant LookupAPI as API lookup va master-data
  participant DB as Supabase
  participant Sheets as Google Sheets Apps Script

  OperatorUser->>CancelForm: Nhap thang, brand, CP, nha mang, nha cung cap
  CancelForm->>LookupAPI: Tai danh muc va kiem tra brand CP
  LookupAPI->>DB: Doc users, brands, cps, operators, providers, mapping
  DB-->>CancelForm: Tra danh muc
  CancelForm->>CancelAPI: Kiem tra overlap theo thang brand CP
  CancelAPI->>DB: Tim phieu huy trung nha cung cap
  alt Co overlap
    CancelAPI-->>CancelForm: Tra loi trung lap de bo tick
  else Khong overlap
    CancelForm->>CancelAPI: Luu phieu huy
    CancelAPI->>DB: Tao cancellations
    CancelAPI->>DB: Tao cancellation_details
    opt Brand va CP match service
      CancelAPI->>DB: Cap nhat cx_services sang Cancelled
      CancelAPI->>DB: Ghi cx_activity_logs CANCEL_SERVICE
    end
    CancelAPI->>Sheets: Dong bo create hoac update
    CancelAPI-->>CancelForm: Tra ma phieu huy
  end
```

## Flow: Báo Cáo Hủy Theo Nhà Cung Cấp

```mermaid
sequenceDiagram
  actor ReportUser as Nguoi xem bao cao
  participant ReportPage as Man hinh Bao cao
  participant MonthsAPI as API report months
  participant ActiveProvidersAPI as API active providers
  participant DataAPI as API report data
  participant ExportAPI as API report export
  participant DB as Supabase

  ReportUser->>ReportPage: Mo Bao cao
  ReportPage->>MonthsAPI: Lay danh sach thang
  MonthsAPI->>DB: Doc cancellations.month
  DB-->>ReportPage: Tra thang moi nhat
  ReportPage->>ActiveProvidersAPI: Quet nha cung cap co du lieu theo thang
  ActiveProvidersAPI->>DB: Doc cancellation_details join cancellations
  DB-->>ReportPage: Tra provider_id active
  ReportUser->>ReportPage: Xem bao cao
  ReportPage->>DataAPI: Lay bao cao theo thang va provider
  DataAPI->>DB: Doc cancellation_details, brand, CP, operator
  DB-->>DataAPI: Tra du lieu chi tiet
  DataAPI-->>ReportPage: Gom theo provider va brand
  opt Xuat file
    ReportUser->>ExportAPI: Xuat CSV hoac Excel
    ExportAPI->>DB: Doc du lieu bao cao
    ExportAPI-->>ReportUser: Tai file
  end
```

## Flow: Cron Gia Hạn Tự Động

```mermaid
sequenceDiagram
  participant Scheduler as Cron scheduler
  participant CronAPI as API cron auto-renew
  participant Actions as cx-actions
  participant DB as Supabase

  Scheduler->>CronAPI: GET voi Authorization Bearer CRON_SECRET
  alt CRON_SECRET sai
    CronAPI-->>Scheduler: 401 Unauthorized
  else Hop le hoac chua cau hinh secret
    CronAPI->>Actions: processAutoRenewContracts
    Actions->>DB: Tim hop dong Active co tu_dong_gia_han va het han trong 7 ngay
    loop Moi hop dong can gia han
      Actions->>Actions: Tinh ngay bat dau moi va ngay ket thuc moi
      Actions->>DB: Tao hop dong moi
      Actions->>DB: Clone dich vu cu sang hop dong moi
      Actions->>DB: Chuyen hop dong cu sang Expired
      Actions->>DB: Ghi activity log RENEW
    end
    CronAPI-->>Scheduler: Tra processedCount
  end
```

## Business Rules For Review

| ID | Nội dung | Nguồn |
| --- | --- | --- |
| BR-cx-all-in-one-001 | Hợp đồng là khung hiệu lực chính của dịch vụ. | BA đã chốt |
| BR-cx-all-in-one-002 | `effective_service_end` dùng ngày nhỏ nhất giữa ngày kết thúc hợp đồng và ngày hết hạn dịch vụ hoặc gói. | BA đã chốt |
| BR-cx-all-in-one-003 | Dịch vụ hoặc gói vượt hạn hợp đồng cần cảnh báo, không tự động tính active hợp lệ sau hạn hợp đồng. | BA đã chốt |
| BR-cx-all-in-one-004 | Sale tạo phiếu, CS kích hoạt thành customer và contract, hệ thống sinh dịch vụ Pending theo từng kênh. | Code hiện hữu |
| BR-cx-all-in-one-005 | Phiếu đã có `result_customer_id` không được kích hoạt lại. | Code hiện hữu |
| BR-cx-all-in-one-006 | Phiếu hủy brandname bị chặn nếu trùng tháng, brand, CP, nhà cung cấp đã chọn. | Code hiện hữu |
| BR-cx-all-in-one-007 | Khi phiếu hủy match brand và CP, dịch vụ liên quan chuyển sang `Cancelled` và ghi log. | Code hiện hữu |
| BR-cx-all-in-one-008 | Dashboard không hiển thị chỉ số ảo nếu chưa có dữ liệu nguồn. | BA đã chốt |

## Open Questions

| ID | Câu hỏi | Gợi ý review |
| --- | --- | --- |
| OQ-cx-all-in-one-001 | Module hủy brandname và báo cáo nhà cung cấp có thuộc phạm vi BA chính của CX All-in-one không? | Code đang liên kết sang `cx_services`, nên nên đưa vào scope hoặc tách feature riêng |
| OQ-cx-all-in-one-002 | `template_registration_method` trong BA là `customer_self_service`, `sup_manual`, `not_required`, nhưng UI hiện có `provider_approval`, `zalo_approval`, `not_required`. | Cần chốt lại danh mục chuẩn |
| OQ-cx-all-in-one-003 | `term_type` trong BA là `contract_bound`, `package_bound`, `technical_tracking`, nhưng UI hiện có `contract_bound`, `independent`. | Cần đồng bộ danh mục |
| OQ-cx-all-in-one-004 | View `vw_cx_services_details` hiện dùng `COALESCE(package_end_date, ngay_het_han, ngay_ket_thuc_hd)`, chưa lấy ngày nhỏ nhất với hợp đồng. | Cần kiểm tra lại với rule `effective_service_end` |
| OQ-cx-all-in-one-005 | Cron auto-renew phụ thuộc trường `tu_dong_gia_han` và `chu_ky_gia_han`, nhưng schema gốc không thấy hai trường này. | Cần xác nhận migration thực tế |
