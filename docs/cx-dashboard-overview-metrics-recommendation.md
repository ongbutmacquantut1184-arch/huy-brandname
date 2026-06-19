# Đề xuất bổ sung số liệu tổng quan cho CX Dashboard

## 1. Mục tiêu tài liệu

Tài liệu này tổng hợp đề xuất bổ sung các số liệu tổng quan cho hệ thống CX dựa trên code và schema hiện có của dự án `CX_All-in-one`.

Phạm vi đề xuất chỉ tập trung vào vận hành CX, khách hàng, hợp đồng, dịch vụ, gia hạn, tải việc và chất lượng dữ liệu. Tài liệu không đưa vào các chỉ số liên quan đến sale hoặc phiếu yêu cầu.

## 2. Nguồn dữ liệu hiện có trong hệ thống

Các số liệu đề xuất bên dưới có thể được xây dựng chủ yếu từ các bảng sau:

| Nhóm dữ liệu | Bảng chính | Trường dữ liệu đáng chú ý |
| --- | --- | --- |
| Khách hàng | `cx_customers` | `customer_id`, `ten_cong_ty`, `trang_thai`, `phan_khuc`, `khu_vuc`, `quoc_gia`, `customer_success`, `customer_support`, `ngay_het_han_hien_tai`, `created_at` |
| Hợp đồng / PO | `cx_contracts` | `contract_id`, `customer_id`, `so_hop_dong`, `so_po`, `ngay_bat_dau_hd`, `ngay_ket_thuc_hd`, `hinh_thuc_thanh_toan`, `trang_thai`, `previous_contract_id`, `created_at` |
| Dịch vụ | `cx_services` | `service_id`, `customer_id`, `contract_id`, `loai_dich_vu`, `brand_name_oa`, `cp_name_code`, `trang_thai`, `ngay_bat_dau`, `ngay_het_han`, `sup_phu_trach`, các trường kết nối hệ thống |
| Nhật ký hoạt động | `cx_activity_logs` | `action`, `target_type`, `target_id`, `performed_by`, `related_customer_id`, `created_at` |

## 3. Số liệu tổng quan hiện có

Dashboard hiện tại đã có các nhóm thông tin nền tảng:

| Nhóm | Số liệu / biểu đồ hiện có | Nhận xét |
| --- | --- | --- |
| Khách hàng | Tổng khách hàng đang hoạt động | Có ích để biết quy mô hiện tại, nhưng chưa thể hiện rủi ro hoặc chất lượng vận hành |
| Dịch vụ | Tổng dịch vụ đang chạy | Có ích nhưng chưa tách theo trạng thái khác như pending, expired, cancelled |
| Cảnh báo hạn | Dịch vụ sắp hết hạn trong 30 ngày | Đây là chỉ số quan trọng, nên mở rộng thành nhiều mốc cảnh báo |
| Phân bổ | Tỷ trọng khách hàng theo phân khúc | Nên giữ, nhưng không nên là biểu đồ trọng tâm nhất |
| Phân bổ | Phân bổ dịch vụ active theo loại dịch vụ | Nên giữ, có thể bổ sung thêm trạng thái và xu hướng |
| Tải việc CS | Bảng CS theo tổng khách hàng và khách hàng active | Nên mở rộng thêm rủi ro hết hạn theo CS |
| Tải việc SUP | Bảng SUP theo số dịch vụ active | Nên mở rộng thêm pending, expired, sắp hết hạn |

Đánh giá: hiện tại dashboard đủ để xem quy mô tổng quát, nhưng chưa đủ để điều hành CX hàng ngày. Các phần còn thiếu nằm ở rủi ro hết hạn, trạng thái hợp đồng/dịch vụ, tải việc theo mức độ khẩn cấp, xu hướng theo thời gian và chất lượng dữ liệu.

## 4. Nguyên tắc đề xuất

1. Không thêm chỉ số sale.
2. Không thêm chỉ số phiếu yêu cầu.
3. Không hiển thị KPI giả nếu chưa có nguồn dữ liệu thật.
4. Ưu tiên chỉ số có thể tính được từ dữ liệu hiện có.
5. Tách rõ số liệu vận hành tức thời, xu hướng, rủi ro và chất lượng dữ liệu.
6. Mỗi biểu đồ cần trả lời được một câu hỏi nghiệp vụ cụ thể.

## 5. Nhóm số liệu nên bổ sung

### 5.1. Nhóm rủi ro hết hạn

Đây là nhóm nên ưu tiên cao nhất vì liên quan trực tiếp đến vận hành, gia hạn và chăm sóc khách hàng.

| Mã | Số liệu đề xuất | Cách tính đề xuất | Kiểu hiển thị | Mức ưu tiên |
| --- | --- | --- | --- | --- |
| EXP-01 | Hợp đồng sắp hết hạn | Đếm `cx_contracts` có `trang_thai = Active` và `ngay_ket_thuc_hd` nằm trong các mốc 0-7, 8-15, 16-30, 31-60 ngày | Stacked bar ngang hoặc heatmap bucket | Cao |
| EXP-02 | Dịch vụ sắp hết hạn | Đếm `cx_services` có `trang_thai = Active` và `ngay_het_han` nằm trong các mốc 0-7, 8-15, 16-30, 31-60 ngày | Stacked bar ngang hoặc heatmap bucket | Cao |
| EXP-03 | Dịch vụ đã quá hạn nhưng chưa đóng | Đếm dịch vụ có `ngay_het_han < today` và trạng thái vẫn là `Active` | Scorecard cảnh báo + bảng drill-down | Cao |
| EXP-04 | Hợp đồng đã quá hạn nhưng chưa đóng | Đếm hợp đồng có `ngay_ket_thuc_hd < today` và trạng thái vẫn là `Active` | Scorecard cảnh báo + bảng drill-down | Cao |
| EXP-05 | Top khách hàng có nhiều dịch vụ sắp hết hạn | Gom theo `customer_id`, đếm dịch vụ hết hạn trong 30 hoặc 45 ngày | Bar ngang top 10 + bảng chi tiết | Cao |

Lý do cần có: hiện dashboard chỉ có một con số "dịch vụ sắp hết hạn 30 ngày". Con số này tốt nhưng chưa đủ để phân biệt việc cần xử lý ngay, sắp xử lý, hay theo dõi sau.

### 5.2. Nhóm trạng thái hợp đồng và dịch vụ

| Mã | Số liệu đề xuất | Cách tính đề xuất | Kiểu hiển thị | Mức ưu tiên |
| --- | --- | --- | --- | --- |
| STA-01 | Cơ cấu trạng thái hợp đồng | Đếm `cx_contracts` theo `trang_thai` | Donut chart + số lượng bên cạnh | Cao |
| STA-02 | Cơ cấu trạng thái dịch vụ | Đếm `cx_services` theo `trang_thai` | Donut chart hoặc stacked bar | Cao |
| STA-03 | Tỷ lệ dịch vụ active trên tổng dịch vụ | `active_services / total_services` | Scorecard có phần trăm | Trung bình |
| STA-04 | Tỷ lệ hợp đồng active trên tổng hợp đồng | `active_contracts / total_contracts` | Scorecard có phần trăm | Trung bình |
| STA-05 | Dịch vụ pending theo loại dịch vụ | Đếm dịch vụ `Pending` theo `loai_dich_vu` | Bar ngang | Trung bình |

Lý do cần có: dashboard hiện chỉ nhấn vào active. Với vận hành CX, phần pending, expired và cancelled cũng quan trọng vì nó cho thấy backlog, rủi ro cập nhật dữ liệu và trạng thái không còn phục vụ.

### 5.3. Nhóm tải việc CS và SUP

| Mã | Số liệu đề xuất | Cách tính đề xuất | Kiểu hiển thị | Mức ưu tiên |
| --- | --- | --- | --- | --- |
| WRK-01 | Tải việc CS theo rủi ro | Mỗi `customer_success`: số khách active, số khách có dịch vụ hết hạn trong 30 ngày, số khách có hợp đồng hết hạn trong 30 ngày | Stacked bar ngang + bảng | Cao |
| WRK-02 | Tải việc SUP theo rủi ro | Mỗi `sup_phu_trach`: active service, pending service, expired service, service hết hạn trong 30 ngày | Stacked bar ngang | Cao |
| WRK-03 | Top SUP đang phụ trách nhiều dịch vụ sắp hết hạn | Gom `cx_services` theo `sup_phu_trach`, lọc hạn 30/45 ngày | Bar ngang top 10 | Cao |
| WRK-04 | Khách hàng chưa gán CS | Đếm customer thiếu `customer_success` | Scorecard cảnh báo + bảng | Trung bình |
| WRK-05 | Dịch vụ chưa gán SUP | Đếm service thiếu `sup_phu_trach` | Scorecard cảnh báo + bảng | Cao |

Lý do cần có: bảng CS/SUP hiện tại chỉ đếm số lượng. Một người phụ trách 30 dịch vụ ổn định khác hoàn toàn với người phụ trách 10 dịch vụ đều sắp hết hạn. Dashboard nên phản ánh mức độ khẩn cấp, không chỉ khối lượng.

### 5.4. Nhóm phân bổ danh mục khách hàng và dịch vụ

| Mã | Số liệu đề xuất | Cách tính đề xuất | Kiểu hiển thị | Mức ưu tiên |
| --- | --- | --- | --- | --- |
| SEG-01 | Khách hàng theo phân khúc | Đếm `cx_customers` theo `phan_khuc` | Donut chart hoặc bar ngang | Đã có, nên giữ |
| SEG-02 | Khách hàng theo khu vực | Đếm `cx_customers` theo `khu_vuc` | Bar ngang | Trung bình |
| SEG-03 | Khách hàng theo quốc gia | Đếm `cx_customers` theo `quoc_gia` | Bar ngang | Thấp đến trung bình |
| SEG-04 | Dịch vụ theo loại dịch vụ | Đếm `cx_services` theo `loai_dich_vu` | Bar chart | Đã có, nên giữ |
| SEG-05 | Dịch vụ theo loại và trạng thái | Đếm `cx_services`, group theo `loai_dich_vu` và `trang_thai` | Stacked bar | Cao |
| SEG-06 | Top CP/Brand/OA theo số dịch vụ | Gom theo `cp_name_code` hoặc `brand_name_oa` | Bar ngang top 10 | Trung bình |

Lý do cần có: nhóm phân bổ giúp nhìn cấu trúc vận hành. Tuy nhiên nên tránh lạm dụng pie chart khi có nhiều nhóm; bar ngang thường dễ đọc hơn.

### 5.5. Nhóm hợp đồng / PO

| Mã | Số liệu đề xuất | Cách tính đề xuất | Kiểu hiển thị | Mức ưu tiên |
| --- | --- | --- | --- | --- |
| CTR-01 | Tổng hợp đồng active | Đếm `cx_contracts` có `trang_thai = Active` | Scorecard | Cao |
| CTR-02 | Hợp đồng không có dịch vụ liên kết | Hợp đồng không có service nào trỏ về `contract_id` | Scorecard cảnh báo + bảng | Cao |
| CTR-03 | Dịch vụ không có hợp đồng liên kết | Dịch vụ có `contract_id` rỗng/null | Scorecard cảnh báo + bảng | Cao |
| CTR-04 | Hợp đồng theo hình thức thanh toán | Đếm theo `hinh_thuc_thanh_toan` | Bar ngang hoặc donut nếu ít nhóm | Trung bình |
| CTR-05 | Chuỗi gia hạn hợp đồng | Dựa vào `previous_contract_id` để xác định hợp đồng được gia hạn từ hợp đồng nào | Timeline/table theo khách hàng | Trung bình |

Lý do cần có: hệ thống đã có module hợp đồng và dịch vụ riêng, nên dashboard tổng quan cần thể hiện sức khỏe liên kết giữa hai phần này. Chỉ số "hợp đồng không có dịch vụ" và "dịch vụ không có hợp đồng" rất hữu ích để phát hiện thiếu sót nhập liệu.

### 5.6. Nhóm xu hướng theo thời gian

| Mã | Số liệu đề xuất | Cách tính đề xuất | Kiểu hiển thị | Mức ưu tiên |
| --- | --- | --- | --- | --- |
| TRD-01 | Khách hàng tạo mới theo tháng | Group `cx_customers.created_at` theo tháng | Line chart hoặc bar chart | Trung bình |
| TRD-02 | Hợp đồng tạo mới theo tháng | Group `cx_contracts.created_at` theo tháng | Line chart hoặc bar chart | Trung bình |
| TRD-03 | Dịch vụ tạo mới theo tháng | Group `cx_services.created_at` theo tháng | Line chart hoặc bar chart | Trung bình |
| TRD-04 | Gia hạn theo tháng | Đếm `cx_activity_logs.action = RENEW` theo tháng | Line chart hoặc bar chart | Trung bình |
| TRD-05 | Tỷ lệ hết hạn theo tháng | Group hợp đồng/dịch vụ theo tháng hết hạn | Calendar heatmap hoặc bar chart theo tháng | Trung bình |

Lý do cần có: dashboard hiện là ảnh chụp tại thời điểm hiện tại. Nhóm xu hướng giúp biết vận hành đang tăng, giảm hay có mùa vụ.

### 5.7. Nhóm kết nối hệ thống và độ phức tạp vận hành

| Mã | Số liệu đề xuất | Cách tính đề xuất | Kiểu hiển thị | Mức ưu tiên |
| --- | --- | --- | --- | --- |
| INT-01 | Dịch vụ có API Gateway | Đếm service có `ket_noi_api_gateway` | Scorecard hoặc bar | Trung bình |
| INT-02 | Dịch vụ có SMPP | Đếm service có `ket_noi_smpp` | Scorecard hoặc bar | Trung bình |
| INT-03 | Dịch vụ có GapOne | Đếm service có `ket_noi_api_gap_one` | Scorecard hoặc bar | Trung bình |
| INT-04 | Dịch vụ có Ví ZCA | Đếm service có `ket_noi_vi_zca` | Scorecard hoặc bar | Trung bình |
| INT-05 | Dịch vụ có kết nối hệ thống khách hàng | Đếm service có `ket_noi_he_thong_kh` | Scorecard hoặc bar | Trung bình |
| INT-06 | Ma trận loại dịch vụ x kiểu kết nối | Group theo `loai_dich_vu` và các trường kết nối | Matrix/heatmap | Thấp đến trung bình |

Lý do cần có: không phải dịch vụ nào cũng có cùng mức độ vận hành. Dịch vụ có nhiều tích hợp thường cần theo dõi kỹ hơn khi gia hạn hoặc thay đổi cấu hình.

### 5.8. Nhóm chất lượng dữ liệu

| Mã | Số liệu đề xuất | Cách tính đề xuất | Kiểu hiển thị | Mức ưu tiên |
| --- | --- | --- | --- | --- |
| DQ-01 | Khách hàng thiếu thông tin định danh | Thiếu `org_id`, `cpid`, `cp_name`, `ten_cong_ty` | Scorecard + bảng chi tiết | Cao |
| DQ-02 | Khách hàng thiếu người phụ trách | Thiếu `customer_success` hoặc `customer_support` | Scorecard + bảng chi tiết | Cao |
| DQ-03 | Dịch vụ thiếu ngày hết hạn | Thiếu `ngay_het_han` | Scorecard + bảng chi tiết | Cao |
| DQ-04 | Dịch vụ thiếu SUP | Thiếu `sup_phu_trach` | Scorecard + bảng chi tiết | Cao |
| DQ-05 | Dịch vụ thiếu hợp đồng liên kết | `contract_id` rỗng/null | Scorecard + bảng chi tiết | Cao |
| DQ-06 | Hợp đồng thiếu ngày kết thúc | Thiếu `ngay_ket_thuc_hd` | Scorecard + bảng chi tiết | Cao |
| DQ-07 | Dữ liệu trạng thái không chuẩn | Giá trị `trang_thai` nằm ngoài danh mục chuẩn | Bar theo loại lỗi | Trung bình |

Lý do cần có: dashboard chỉ đáng tin khi dữ liệu đủ sạch. Nhóm này nên được đặt ở cuối trang tổng quan hoặc tab riêng "Chất lượng dữ liệu".

## 6. Đề xuất cấu trúc dashboard tổng quan

### 6.1. Hàng 1: Scorecard điều hành

| Thẻ | Nội dung |
| --- | --- |
| Khách hàng active | Tổng khách hàng đang hoạt động |
| Dịch vụ active | Tổng dịch vụ đang hoạt động |
| Hợp đồng active | Tổng hợp đồng đang hoạt động |
| Dịch vụ hết hạn trong 30 ngày | Cảnh báo vận hành |
| Hợp đồng hết hạn trong 30 ngày | Cảnh báo gia hạn |

### 6.2. Hàng 2: Rủi ro hết hạn

| Khối | Biểu đồ |
| --- | --- |
| Hợp đồng theo bucket hết hạn | Stacked bar ngang theo mốc 0-7, 8-15, 16-30, 31-60 ngày |
| Dịch vụ theo bucket hết hạn | Stacked bar ngang theo mốc 0-7, 8-15, 16-30, 31-60 ngày |

### 6.3. Hàng 3: Trạng thái vận hành

| Khối | Biểu đồ |
| --- | --- |
| Trạng thái hợp đồng | Donut chart + số lượng |
| Trạng thái dịch vụ | Donut chart + số lượng |
| Loại dịch vụ x trạng thái | Stacked bar |

### 6.4. Hàng 4: Tải việc theo người phụ trách

| Khối | Biểu đồ |
| --- | --- |
| CS theo khách hàng và rủi ro hết hạn | Stacked bar ngang |
| SUP theo dịch vụ và rủi ro hết hạn | Stacked bar ngang |
| Top khách hàng cần xử lý | Bảng top 10 có link mở Customer 360 |

### 6.5. Hàng 5: Chất lượng dữ liệu

| Khối | Biểu đồ |
| --- | --- |
| Lỗi dữ liệu quan trọng | Scorecard cảnh báo |
| Loại lỗi dữ liệu phổ biến | Bar chart |
| Danh sách cần bổ sung thông tin | Bảng drill-down |

## 7. Ma trận ưu tiên triển khai

| Giai đoạn | Hạng mục | Lý do |
| --- | --- | --- |
| Phase 1 | Scorecard active: khách hàng, dịch vụ, hợp đồng | Hoàn thiện bức tranh tổng quan nền |
| Phase 1 | Bucket hết hạn hợp đồng/dịch vụ | Cần nhất cho vận hành hàng ngày |
| Phase 1 | Trạng thái hợp đồng/dịch vụ | Giúp thấy pending, expired, cancelled thay vì chỉ active |
| Phase 1 | Dịch vụ thiếu SUP, thiếu ngày hết hạn, thiếu hợp đồng | Chỉ số chất lượng dữ liệu quan trọng |
| Phase 2 | Tải việc CS/SUP theo rủi ro | Giúp điều phối người phụ trách tốt hơn |
| Phase 2 | Top khách hàng có nhiều rủi ro hết hạn | Hỗ trợ ưu tiên chăm sóc |
| Phase 2 | Dịch vụ theo loại và trạng thái | Giúp đọc cấu trúc vận hành |
| Phase 3 | Xu hướng theo tháng | Hữu ích sau khi dữ liệu đủ ổn định theo thời gian |
| Phase 3 | Ma trận kết nối hệ thống | Hữu ích cho vận hành kỹ thuật và hỗ trợ |

## 8. Checklist chấp nhận khi triển khai

1. Không có chỉ số sale trong dashboard tổng quan CX.
2. Không có chỉ số phiếu yêu cầu trong dashboard tổng quan CX.
3. Mỗi số liệu hiển thị phải truy ngược được về bảng/cột nguồn.
4. Các số liệu cảnh báo hết hạn phải có cùng quy tắc ngày.
5. Các trạng thái phải được chuẩn hóa trước khi tính tỷ lệ.
6. Các biểu đồ có drill-down nên mở được danh sách khách hàng, hợp đồng hoặc dịch vụ liên quan.
7. Không hiển thị số ảo hoặc dữ liệu mẫu.
8. Khi dữ liệu thiếu, hiển thị trạng thái "Chưa đủ dữ liệu" thay vì suy đoán.

## 9. Câu hỏi cần chốt trước khi triển khai

1. Mốc cảnh báo hết hạn nên dùng 30 ngày hay thêm 7/15/45/60 ngày?
2. Trạng thái chuẩn cuối cùng của hợp đồng gồm những giá trị nào?
3. Trạng thái chuẩn cuối cùng của dịch vụ gồm những giá trị nào?
4. Có cần tách dashboard "Tổng quan điều hành" và tab "Chất lượng dữ liệu" không?
5. Dashboard tổng quan nên mặc định xem toàn bộ dữ liệu hay cho phép lọc theo CS/SUP/khu vực/loại dịch vụ?
6. Có cần xem xu hướng theo tháng ngay ở giai đoạn đầu không, hay để sau khi dữ liệu vận hành ổn định?

## 10. Kết luận đề xuất

Phần tổng quan hiện tại nên được xem là bản nền, chưa phải dashboard điều hành đầy đủ. Các số liệu nên bổ sung trước là:

1. Hợp đồng sắp hết hạn theo bucket thời gian.
2. Dịch vụ sắp hết hạn theo bucket thời gian.
3. Hợp đồng/dịch vụ đã quá hạn nhưng vẫn active.
4. Cơ cấu trạng thái hợp đồng.
5. Cơ cấu trạng thái dịch vụ.
6. Tải việc SUP theo số lượng và rủi ro.
7. Tải việc CS theo khách hàng và rủi ro.
8. Dịch vụ thiếu SUP, thiếu ngày hết hạn, thiếu hợp đồng.
9. Hợp đồng không có dịch vụ liên kết.
10. Top khách hàng có nhiều dịch vụ/hợp đồng cần xử lý.

Nếu triển khai theo thứ tự này, dashboard sẽ chuyển từ mức "xem số lượng tổng" sang mức "điều hành công việc CX hằng ngày" mà vẫn bám sát dữ liệu thật trong hệ thống.
