-- Rename loai_khach_hang to loai_yeu_cau in cx_requests
ALTER TABLE cx_requests RENAME COLUMN loai_khach_hang TO loai_yeu_cau;

-- Add loai_hop_dong to cx_contracts
ALTER TABLE cx_contracts ADD COLUMN loai_hop_dong TEXT DEFAULT 'Subscription';

-- Add new columns to cx_services
ALTER TABLE cx_services
    ADD COLUMN channel TEXT,
    ADD COLUMN usage_method TEXT,
    ADD COLUMN package_type TEXT,
    ADD COLUMN package_start_date DATE,
    ADD COLUMN package_end_date DATE,
    ADD COLUMN term_type TEXT,
    ADD COLUMN template_registration_method TEXT,
    ADD COLUMN brand_id TEXT REFERENCES brands(id) ON DELETE SET NULL,
    ADD COLUMN cp_id TEXT REFERENCES cps(id) ON DELETE SET NULL;

-- Create View vw_cx_services_details
CREATE OR REPLACE VIEW vw_cx_services_details AS
SELECT 
    s.*,
    c.ngay_ket_thuc_hd,
    -- Nếu có hạn của gói/kênh thì lấy theo gói/kênh, không bị block bởi hợp đồng
    COALESCE(s.package_end_date, s.ngay_het_han, c.ngay_ket_thuc_hd) as effective_service_end
FROM cx_services s
LEFT JOIN cx_contracts c ON s.contract_id = c.contract_id;
