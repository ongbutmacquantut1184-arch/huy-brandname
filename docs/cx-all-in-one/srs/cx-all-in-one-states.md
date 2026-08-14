---
type: srs-states
feature: cx-all-in-one
updated: 2026-07-31
links:
  - docs/cx-all-in-one/srs/cx-all-in-one-flows.md
  - docs/cx-service-term-dashboard-update-plan.md
---

# CX All-in-one States

## State: Phiếu Sale

```mermaid
stateDiagram-v2
  [*] --> PendingRequest: Sale submit form
  PendingRequest --> PendingRequest: CS search and review
  PendingRequest --> Activated: activateRequest success
  PendingRequest --> Rejected: Not found or invalid input
  Activated --> Activated: Search again shows already created
  Activated --> [*]
  Rejected --> PendingRequest: Fix data and retry
```

| State | Điều kiện dữ liệu | Ghi chú |
| --- | --- | --- |
| PendingRequest | `cx_requests.result_customer_id` rỗng | Chờ CS kích hoạt |
| Activated | `result_customer_id` đã có mã khách hàng | Không cho tạo lại |
| Rejected | Lỗi tìm phiếu hoặc lỗi dữ liệu khi kích hoạt | Không phải trạng thái lưu cứng trong DB |

## State: Khách Hàng

```mermaid
stateDiagram-v2
  [*] --> Pending: Created but not fully operational
  Pending --> Active: Account and contract are ready
  Active --> Suspended: Business or operation hold
  Suspended --> Active: Reactivate
  Active --> Churned: Customer leaves service
  Churned --> Active: Win back or renew
  Active --> Inactive: No active service
  Inactive --> Active: New service or renew
```

| State | Nguồn | Ghi chú |
| --- | --- | --- |
| Active | `cx_customers.trang_thai` hoặc suy từ dịch vụ active trong `getCustomersOverview` | Dashboard đang hiển thị khách active |
| Pending | Danh mục fallback có giá trị `Pending` | Cần chốt cách dùng |
| Suspended | Danh mục fallback có giá trị `Suspended` | Cần chốt rule treo |
| Churned | Danh mục fallback có giá trị `Churned` | Nên liên kết event `CHURN` khi có lịch sử |
| Inactive | Code suy luận khi không có dịch vụ Active | Có thể không lưu trực tiếp trong DB |

## State: Hợp Đồng

```mermaid
stateDiagram-v2
  [*] --> Active: Create contract
  Active --> ExpiringSoon: End date within alert window
  ExpiringSoon --> Active: Renew before expiry
  ExpiringSoon --> Expired: End date passed
  Active --> Expired: Manual close or renewed into new contract
  Active --> Cancelled: Cancel contract
  Expired --> Active: Renew into new contract
  Cancelled --> [*]
```

| State | Điều kiện dữ liệu | Ghi chú |
| --- | --- | --- |
| Active | `cx_contracts.trang_thai = Active` | Được tính vào dashboard active |
| ExpiringSoon | `ngay_ket_thuc_hd` trong bucket cảnh báo | State nghiệp vụ hiển thị, không nhất thiết lưu DB |
| Expired | `trang_thai = Expired` hoặc hợp đồng cũ sau gia hạn | Code chuyển hợp đồng cũ sang Expired |
| Cancelled | `trang_thai = Cancelled` | Có trong UI hợp đồng |

## State: Dịch Vụ

```mermaid
stateDiagram-v2
  [*] --> Pending: Auto created from activated request
  Pending --> Active: SUP completes service configuration
  Active --> ExpiringSoon: effective_service_end within alert window
  ExpiringSoon --> Active: Renew service or contract
  Active --> Suspended: Temporary hold
  Suspended --> Active: Resume operation
  Active --> Expired: End date passed
  Expired --> Active: Renew service
  Active --> Cancelled: Cancellation matched by brand and CP
  Pending --> Cancelled: Cancel before activation
  Cancelled --> [*]
```

| State | Điều kiện dữ liệu | Ghi chú |
| --- | --- | --- |
| Pending | `cx_services.trang_thai = Pending` | Được sinh tự động khi kích hoạt phiếu |
| Active | `trang_thai = Active` | Dashboard tính active và rủi ro hết hạn |
| Suspended | Danh mục fallback có giá trị `Suspended` | UI service filter chưa luôn liệt kê Suspended |
| ExpiringSoon | `effective_service_end` trong bucket cảnh báo | Theo BA nên dùng effective end |
| Expired | `trang_thai = Expired` hoặc ngày hết hạn đã qua | Dashboard có bucket quá hạn |
| Cancelled | `trang_thai = Cancelled` | API hủy brandname tự động chuyển trạng thái khi match brand và CP |

## State: Phiếu Hủy Brandname

```mermaid
stateDiagram-v2
  [*] --> Draft: User fills cancellation form
  Draft --> DuplicateBlocked: Month brand CP provider overlap
  DuplicateBlocked --> Draft: User removes duplicated providers
  Draft --> Saved: POST cancellation success
  Saved --> Editing: Open editId
  Editing --> ConflictBlocked: updated_at mismatch or overlap
  ConflictBlocked --> Editing: Refresh or fix overlap
  Editing --> Saved: PUT cancellation success
  Saved --> SyncedToSheets: Apps Script sync success
  Saved --> SyncSkipped: Missing GOOGLE_SCRIPT_SYNC_URL
  Saved --> SyncFailed: Apps Script error
```

| State | Điều kiện | Ghi chú |
| --- | --- | --- |
| Draft | Form chưa lưu | Không lưu DB |
| DuplicateBlocked | API trả 409 do overlap | Chặn lưu trùng |
| Saved | Có bản ghi `cancellations` và `cancellation_details` | Có thể đã cập nhật `cx_services` sang Cancelled |
| ConflictBlocked | Edit bị stale hoặc overlap | Bảo vệ khi nhiều người sửa |
| SyncedToSheets | Sync nền thành công | Không block kết quả lưu chính |
| SyncSkipped | Chưa cấu hình URL sync | Có log cảnh báo |
| SyncFailed | Apps Script lỗi | Có log lỗi, bản ghi chính vẫn đã lưu |
