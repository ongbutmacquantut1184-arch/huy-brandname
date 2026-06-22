# Kế hoạch cập nhật logic dịch vụ và dashboard quản trị CX

## 1. Mục tiêu

Tài liệu này tổng hợp các phần đã chốt để triển khai tiếp theo cho hệ thống `CX_All-in-one`.

Phạm vi cập nhật gồm:

- Chuẩn hóa quan hệ giữa thời hạn hợp đồng, thời hạn dịch vụ và thời hạn gói.
- Bổ sung dữ liệu phục vụ dashboard quản trị theo kênh gửi tin, hình thức sử dụng, loại gói cước, hình thức thanh toán và tải SUP.
- Thêm lựa chọn cách khai báo template trong thông tin dịch vụ.
- Lập kế hoạch triển khai theo phase, giữ mức độ gọn nhẹ và bám sát nghiệp vụ hiện tại.

## 2. Hiện trạng dữ liệu liên quan

Hệ thống hiện có các bảng và trường nền tảng sau:

| Nhóm | Bảng | Trường đang có |
| --- | --- | --- |
| Phiếu Sale | `cx_requests` | `loai_goi_cuoc`, `kenh_gui_tin`, `du_lieu_input`, `hinh_thuc_sd`, `hinh_thuc_thanh_toan`, `ngay_bat_dau`, `ngay_ket_thuc` |
| Khách hàng | `cx_customers` | `kenh_gui_tin`, `du_lieu_input`, `ngay_bat_dau_sd`, `ngay_het_han_hien_tai`, `customer_success`, `customer_support`, `sale_phu_trach` |
| Hợp đồng | `cx_contracts` | `ngay_bat_dau_hd`, `ngay_ket_thuc_hd`, `thoi_han_hd_ngay`, `thoi_han_hd_nam`, `hinh_thuc_thanh_toan`, `trang_thai`, `previous_contract_id` |
| Dịch vụ | `cx_services` | `contract_id`, `loai_dich_vu`, `brand_name_oa`, `thoi_han_brand`, `ngay_bat_dau`, `ngay_het_han`, `sup_phu_trach`, `trang_thai`, các trường kết nối |
| Nhật ký | `cx_activity_logs` | `action`, `target_type`, `target_id`, `performed_by`, `related_customer_id`, `created_at` |

Nhận xét:

- `kenh_gui_tin`, `loai_goi_cuoc`, `hinh_thuc_sd` hiện chủ yếu nằm ở cấp phiếu/khách hàng.
- `hinh_thuc_thanh_toan` đã có ở cấp hợp đồng.
- Dịch vụ chưa có trường riêng để lưu kênh gửi tin, hình thức sử dụng, loại gói cước và cách khai báo template.
- Nếu dashboard tính theo dịch vụ nhưng lấy kênh/gói từ khách hàng thì sẽ không chính xác khi một khách có nhiều dịch vụ hoặc nhiều kênh.

## 3. Nguyên tắc nghiệp vụ đã chốt

### 3.1. Hợp đồng là khung hiệu lực chính

Thời hạn dịch vụ đi theo hợp đồng. Một dịch vụ không nên được xem là đang hiệu lực hợp lệ nếu hợp đồng cha đã hết hạn.

Quy tắc tính ngày hiệu lực thực tế:

```text
effective_service_end = min(contract.ngay_ket_thuc_hd, service.ngay_het_han hoặc package_end_date nếu có)
```

Nếu ngày hết hạn dịch vụ/gói lớn hơn ngày kết thúc hợp đồng, hệ thống không tính dịch vụ còn active hợp lệ sau ngày kết thúc hợp đồng. Trường hợp này cần được đánh dấu thành cảnh báo nghiệp vụ.

### 3.2. Tách rõ ba loại thời hạn

| Loại thời hạn | Ý nghĩa | Vị trí dữ liệu |
| --- | --- | --- |
| Thời hạn hợp đồng | Khung pháp lý/thương mại chính | `cx_contracts.ngay_bat_dau_hd`, `cx_contracts.ngay_ket_thuc_hd` |
| Thời hạn dịch vụ | Thời gian triển khai/vận hành dịch vụ trong hợp đồng | `cx_services.ngay_bat_dau`, `cx_services.ngay_het_han` |
| Thời hạn gói/quyền sử dụng | Thời hạn riêng của gói, ví dụ gói OA | Nên bổ sung riêng, không dùng lẫn với thời hạn hợp đồng |

### 3.3. Xử lý trường hợp gói còn hạn nhưng hợp đồng hết hạn

Nếu gói như OA còn hạn sau ngày kết thúc hợp đồng:

- Không tính service là active hợp lệ sau `ngay_ket_thuc_hd`.
- Hiện cảnh báo: "Gói còn hạn nhưng hợp đồng đã/sắp hết hạn".
- Cho CS/CX xử lý theo một trong các hướng:
  - Gia hạn hợp đồng.
  - Chuyển phần gói còn lại sang hợp đồng mới.
  - Ghi nhận carry-over nếu chính sách cho phép.
  - Đóng hiệu lực theo hợp đồng nếu chính sách không cho carry-over.

## 4. Cập nhật dữ liệu để tính dashboard đúng hơn

### 4.1. Bổ sung trường ở cấp dịch vụ

Nên bổ sung các trường sau vào `cx_services`:

| Trường | Kiểu dữ liệu | Mục đích |
| --- | --- | --- |
| `channel` | `TEXT` | Kênh gửi tin của dịch vụ: SMS, Zalo ZNS, Zalo OA, Viber, WhatsApp... |
| `usage_method` | `TEXT` | Hình thức sử dụng: API Gateway, Web Portal, SMPP, Mobile App, Khác... |
| `package_type` | `TEXT` | Loại gói cước/cấp gói: Trial, Cơ bản, Tiêu chuẩn, Cao cấp, Custom... |
| `package_start_date` | `DATE` | Ngày bắt đầu gói nếu gói có thời hạn riêng |
| `package_end_date` | `DATE` | Ngày hết hạn gói nếu gói có thời hạn riêng |
| `term_type` | `TEXT` | Cách tính thời hạn: `contract_bound`, `package_bound`, `technical_tracking` |
| `template_registration_method` | `TEXT` | Cách khai báo template: `customer_self_service`, `sup_manual`, `not_required` |

### 4.2. Giá trị chuẩn để dùng trong UI và báo cáo

`term_type`:

| Giá trị | Ý nghĩa |
| --- | --- |
| `contract_bound` | Dịch vụ đi theo thời hạn hợp đồng |
| `package_bound` | Dịch vụ/gói có thời hạn gói riêng nhưng hiệu lực vẫn bị chặn bởi hợp đồng |
| `technical_tracking` | Ngày chỉ phục vụ theo dõi kỹ thuật/cấu hình, không phải hiệu lực thương mại |

`template_registration_method`:

| Giá trị | Nhãn hiển thị | Áp dụng |
| --- | --- | --- |
| `customer_self_service` | Khách tự khai báo | Chủ yếu cho Zalo OA |
| `sup_manual` | SUP khai báo | SMS, Viber, WhatsApp và Zalo OA khi khách gửi nội dung cho SUP |
| `not_required` | Không cần khai báo template | Kênh/dịch vụ không cần template |

### 4.3. Logic mặc định cho khai báo template

Trong form thông tin dịch vụ, thêm một ô chọn "Khai báo template".

Quy tắc gợi ý:

| Kênh | Giá trị mặc định | Cho phép chỉnh sửa |
| --- | --- | --- |
| Zalo OA | `customer_self_service` hoặc `sup_manual` | Có |
| SMS | `sup_manual` | Có thể khóa hoặc cho sửa |
| Viber | `sup_manual` | Có thể khóa hoặc cho sửa |
| WhatsApp | `sup_manual` | Có thể khóa hoặc cho sửa |
| Kênh khác không cần template | `not_required` | Có |

Không tạo module template riêng trong giai đoạn này. Chỉ lưu cách khai báo template ở cấp dịch vụ để tính tải SUP.

## 5. Bộ số liệu dashboard đã chốt

### 5.1. Phân bổ và tương quan kênh

| Chỉ số | Công thức/nguồn dữ liệu | Mục đích | Ưu tiên |
| --- | --- | --- | --- |
| Phân bổ dịch vụ theo kênh gửi tin | `count(cx_services.service_id) group by channel` | Biết kênh nào chiếm tỷ trọng lớn nhất | Cao |
| Dịch vụ active theo kênh | `count(service) where trang_thai = 'Active' group by channel` | Biết tải vận hành hiện tại theo kênh | Cao |
| Dịch vụ sắp hết hạn theo kênh | `count(service) where effective_service_end <= today + 30 group by channel` | Ưu tiên chăm sóc/gia hạn | Cao |
| Ma trận Kênh x Hình thức sử dụng | `count(service) group by channel, usage_method` | Heatmap combo phổ biến nhất | Cao |
| Ma trận Kênh x Cách khai báo template | `count(service) group by channel, template_registration_method` | Thấy tỷ lệ khách tự khai báo/SUP khai báo | Trung bình |

### 5.2. Tải SUP và phân bổ nhân sự

| Chỉ số | Công thức/nguồn dữ liệu | Mục đích | Ưu tiên |
| --- | --- | --- | --- |
| Tải dịch vụ theo SUP x Kênh gửi tin | `count(service) group by sup_phu_trach, channel` | Xem mỗi SUP đang gánh bao nhiêu dịch vụ theo kênh | Cao |
| Tải SUP theo kênh và trạng thái | `count(service) group by sup_phu_trach, channel, trang_thai` | Tách active/pending/expired/cancelled | Cao |
| Tải SUP theo rủi ro hết hạn | `count(service) where effective_service_end <= today + 30 group by sup_phu_trach, channel` | Biết ai đang gánh nhiều việc cần xử lý gấp | Cao |
| Tải SUP do khai báo template | `count(service) where template_registration_method = 'sup_manual' group by sup_phu_trach, channel` | Tính đúng tải template SUP phải làm | Cao |
| Tỷ lệ khách tự khai báo Zalo OA | `customer_self_service / total Zalo OA services` | Đo mức độ tự phục vụ của khách | Trung bình |

Công thức tải SUP đơn giản giai đoạn đầu:

```text
sup_service_load = count(active services)
sup_template_load = count(services where template_registration_method = 'sup_manual')
sup_risk_load = count(services where effective_service_end <= today + 30 or effective_service_end < today)
```

Nếu cần điểm tải tổng hợp:

```text
sup_total_load_score = active_service_count + sup_template_load + expiring_30d_count + overdue_count
```

Giai đoạn đầu không cần trọng số phức tạp. Khi dữ liệu thực tế rõ hơn mới cần tính effort weight.

### 5.3. Loại gói cước và thanh toán

| Chỉ số | Công thức/nguồn dữ liệu | Mục đích | Ưu tiên |
| --- | --- | --- | --- |
| Loại gói cước x Hình thức thanh toán | `count(service/contract) group by package_type, hinh_thuc_thanh_toan` | Thấy cấu trúc gói và cách thanh toán | Cao |
| Dịch vụ sắp hết hạn theo gói | `count(service) where effective_service_end <= today + 30 group by package_type` | Biết gói nào cần chăm sóc | Cao |
| Gói còn hạn nhưng hợp đồng sắp/đã hết hạn | `package_end_date > ngay_ket_thuc_hd` | Phát hiện lệch nghiệp vụ cần xử lý | Cao |
| Trial sắp hết hạn | `package_type = Trial and effective_service_end <= today + 30` | Danh sách cần thúc đẩy chuyển đổi | Cao |

### 5.4. Chuyển đổi và giữ chân

Nhóm này chỉ nên triển khai sau khi có đủ lịch sử event và trường gói trước/sau.

| Chỉ số | Công thức đề xuất | Mục đích |
| --- | --- | --- |
| Tỷ lệ gia hạn theo kênh | `renewed_before_or_within_grace(channel) / expiring_eligible(channel)` | Kênh nào giữ chân tốt nhất |
| Tỷ lệ churn theo gói cước | `churned(package_type) / active_or_expiring_package(package_type)` | Gói nào hay bị hủy |
| Tỷ lệ upsell | `upgraded_package / renewed_contracts_or_expiring_eligible` | Khách nào có tiềm năng nâng gói |
| Tỷ lệ Trial -> Sub | `converted_from_trial_to_paid / total_trial_ended` | Hiệu quả trial |
| Thời gian trễ gia hạn trung bình theo thanh toán | `avg(renew_date - contract_end_date) where renew_date > contract_end_date group by hinh_thuc_thanh_toan` | Hình thức thanh toán nào hay trễ |
| Tải trung bình SUP theo kênh | `active_services(channel) / active_sup_count(channel)` | Kiểm tra phân bổ SUP có hợp lý không |

Cần chuẩn hóa event trong `cx_activity_logs`:

| Event | Mục đích |
| --- | --- |
| `RENEW` | Hợp đồng/dịch vụ được gia hạn |
| `CHURN` | Khách/dịch vụ rời hệ thống |
| `UPGRADE` | Nâng gói |
| `DOWNGRADE` | Hạ gói |
| `TRIAL_CONVERTED` | Trial chuyển thành gói trả phí |

## 6. Yêu cầu UI

### 6.1. Form dịch vụ

Trong màn hình tạo/sửa dịch vụ, bổ sung các trường:

- Kênh gửi tin.
- Hình thức sử dụng.
- Loại gói cước.
- Kiểu thời hạn: đi theo hợp đồng / theo gói riêng / chỉ theo dõi kỹ thuật.
- Ngày bắt đầu gói và ngày hết hạn gói nếu chọn theo gói riêng.
- Khai báo template:
  - Khách tự khai báo.
  - SUP khai báo.
  - Không cần khai báo template.

### 6.2. Cảnh báo trong form

Cần có validate/cảnh báo:

- Nếu `ngay_het_han` hoặc `package_end_date` lớn hơn `ngay_ket_thuc_hd`, hiện cảnh báo: "Thời hạn gói/dịch vụ vượt thời hạn hợp đồng".
- Không chặn lưu trong mọi trường hợp, vì có trường hợp gói còn hạn cần theo dõi, nhưng phải đánh dấu rõ để dashboard tính theo `effective_service_end`.
- Nếu `channel` là SMS/Viber/WhatsApp và `template_registration_method` rỗng, mặc định `sup_manual`.
- Nếu `channel` là Zalo OA, bắt buộc chọn khách tự khai báo hoặc SUP khai báo.

## 7. Kế hoạch triển khai

### Phase 1. Chuẩn hóa dữ liệu dịch vụ

Mục tiêu: có đủ dữ liệu để tính dashboard đúng theo cấp dịch vụ.

Công việc:

1. Thêm migration cho các trường mới trong `cx_services`.
2. Cập nhật action tạo/sửa dịch vụ để lưu các trường mới.
3. Cập nhật form tạo/sửa dịch vụ.
4. Backfill tạm thời:
   - `channel` lấy từ `cx_customers.kenh_gui_tin` nếu chưa có.
   - `usage_method` lấy từ phiếu/request nếu xác định được.
   - `package_type` lấy từ `cx_requests.loai_goi_cuoc` nếu xác định được.
   - `template_registration_method` mặc định theo quy tắc kênh.

Acceptance:

- Tạo mới dịch vụ lưu được kênh, hình thức sử dụng, loại gói, cách khai báo template.
- Sửa dịch vụ cập nhật đúng các trường này.
- Không làm mất logic hợp đồng/dịch vụ hiện có.

### Phase 2. Logic hiệu lực và cảnh báo

Mục tiêu: tính đúng hiệu lực dịch vụ theo hợp đồng.

Công việc:

1. Tạo helper tính `effective_service_end`.
2. Dashboard và cảnh báo hết hạn dùng `effective_service_end`.
3. Thêm cảnh báo gói/dịch vụ vượt thời hạn hợp đồng.
4. Cập nhật logic gia hạn hợp đồng:
   - `contract_bound`: ngày dịch vụ theo hợp đồng mới.
   - `package_bound`: giữ ngày gói riêng nhưng effective end vẫn bị chặn bởi hợp đồng.
   - `technical_tracking`: chỉ theo dõi cảnh báo, không quyết định hiệu lực thương mại.

Acceptance:

- Service/gói có ngày hết hạn lớn hơn hợp đồng không được tính active hợp lệ sau ngày hợp đồng hết hạn.
- Dashboard có thể hiện cảnh báo "gói còn hạn nhưng hợp đồng hết hạn".

### Phase 3. Dashboard phân bổ và tải SUP

Mục tiêu: cung cấp dashboard điều phối nhân sự và cấu trúc kênh.

Công việc:

1. Phân bổ dịch vụ theo kênh gửi tin.
2. Heatmap Kênh x Hình thức sử dụng.
3. Group bar SUP x Kênh gửi tin.
4. Matrix Loại gói cước x Hình thức thanh toán.
5. Chỉ số tải SUP do khai báo template.
6. Drill-down từ biểu đồ xuống danh sách dịch vụ/khách hàng.

Acceptance:

- Quản lý xem được kênh nào chiếm tỷ trọng lớn.
- Quản lý xem được combo kênh/hình thức sử dụng phổ biến.
- Quản lý xem được mỗi SUP đang gánh bao nhiêu dịch vụ và bao nhiêu việc khai báo template.

### Phase 4. Chuyển đổi, giữ chân và upsell

Mục tiêu: đo hiệu quả gia hạn, churn, trial và upsell.

Công việc:

1. Chuẩn hóa event trong `cx_activity_logs`.
2. Lưu lịch sử gói trước/sau khi gia hạn hoặc thay đổi gói.
3. Tính renewal rate theo kênh.
4. Tính churn rate theo gói.
5. Tính Trial -> Sub.
6. Tính thời gian trễ gia hạn theo hình thức thanh toán.
7. Tạo danh sách khách cần thúc đẩy.

Acceptance:

- Chỉ số chuyển đổi/giữ chân có công thức rõ và truy ngược được về dữ liệu nguồn.
- Không hiển thị chỉ số nếu chưa đủ dữ liệu lịch sử.

## 8. Thứ tự ưu tiên để làm ngay

1. Thêm `channel`, `usage_method`, `package_type`, `term_type`, `package_start_date`, `package_end_date`, `template_registration_method` vào `cx_services`.
2. Cập nhật form dịch vụ và action tạo/sửa dịch vụ.
3. Tính `effective_service_end` và cảnh báo vượt hạn hợp đồng.
4. Làm dashboard Phase 3:
   - Phân bổ dịch vụ theo kênh.
   - Heatmap Kênh x Hình thức sử dụng.
   - SUP x Kênh.
   - SUP x Kênh x Khai báo template.
   - Loại gói x Hình thức thanh toán.
5. Sau khi có đủ event và lịch sử gói, làm Phase 4.

## 9. Checklist cho dev

- [ ] Migration không phá dữ liệu cũ.
- [ ] Form dịch vụ có trường khai báo template đúng phạm vi đã chốt.
- [ ] Zalo OA cho chọn khách tự khai báo hoặc SUP khai báo.
- [ ] SMS/Viber/WhatsApp mặc định SUP khai báo.
- [ ] Dashboard không tính service active hợp lệ sau ngày hết hạn hợp đồng.
- [ ] Dashboard tải SUP có tính thêm số service cần SUP khai báo template.
- [ ] Các chart có drill-down về danh sách dịch vụ/khách hàng.
- [ ] Các chỉ số conversion/retention chỉ hiện khi có đủ event nguồn.
- [ ] Không tạo module template riêng trong phase này.

## 10. Câu hỏi còn có thể chốt sau

1. Danh mục kênh cuối cùng gồm những giá trị nào: SMS Brandname, Zalo ZNS, Zalo OA, Viber, WhatsApp, Voice, Multi-channel?
2. `package_type` nên dùng chung với `loai_goi_cuoc` hiện tại hay tách danh mục riêng cho từng kênh?
3. Có cho phép một service có nhiều kênh không, hay tách thành nhiều service theo từng kênh?
4. Khi gói còn hạn nhưng hợp đồng hết hạn, chính sách mặc định là carry-over hay bắt buộc gia hạn hợp đồng?
5. Dashboard tải SUP cần tính theo số lượng đơn giản hay thêm điểm trọng số sau khi có dữ liệu thực tế?
