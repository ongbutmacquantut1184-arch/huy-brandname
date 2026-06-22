-- Bảng Danh mục
CREATE TABLE users (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL
);

CREATE TABLE owners (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL
);

CREATE TABLE cps (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL
);

CREATE TABLE brands (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    owner_id TEXT REFERENCES owners(id) ON DELETE SET NULL,
    cp_id TEXT REFERENCES cps(id) ON DELETE SET NULL
);

CREATE TABLE operators (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    order_index INTEGER DEFAULT 999
);

CREATE TABLE providers (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    emails TEXT
);

CREATE TABLE operator_provider_map (
    operator_id TEXT REFERENCES operators(id) ON DELETE CASCADE,
    provider_id TEXT REFERENCES providers(id) ON DELETE CASCADE,
    PRIMARY KEY (operator_id, provider_id)
);

-- Bảng Dữ liệu Hủy
CREATE TABLE cancellations (
    id TEXT PRIMARY KEY,
    user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
    user_name TEXT,
    enter_date DATE NOT NULL,
    brand_id TEXT REFERENCES brands(id) ON DELETE CASCADE,
    owner_id TEXT REFERENCES owners(id) ON DELETE SET NULL,
    cp_id TEXT REFERENCES cps(id) ON DELETE SET NULL,
    month TEXT NOT NULL,
    note TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE cancellation_details (
    cancellation_id TEXT REFERENCES cancellations(id) ON DELETE CASCADE,
    operator_id TEXT REFERENCES operators(id) ON DELETE CASCADE,
    provider_id TEXT REFERENCES providers(id) ON DELETE CASCADE,
    PRIMARY KEY (cancellation_id, operator_id, provider_id)
);

-- Bật tính năng Realtime cho bảng
ALTER PUBLICATION supabase_realtime ADD TABLE cancellations, cancellation_details;

-- Thiết lập RLS (Bảo mật Row Level Security) - Hiện tại tắt để dùng cho nội bộ (Public access)
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE owners DISABLE ROW LEVEL SECURITY;
ALTER TABLE cps DISABLE ROW LEVEL SECURITY;
ALTER TABLE brands DISABLE ROW LEVEL SECURITY;
ALTER TABLE operators DISABLE ROW LEVEL SECURITY;
ALTER TABLE providers DISABLE ROW LEVEL SECURITY;
ALTER TABLE operator_provider_map DISABLE ROW LEVEL SECURITY;
ALTER TABLE cancellations DISABLE ROW LEVEL SECURITY;
ALTER TABLE cancellation_details DISABLE ROW LEVEL SECURITY;

-- ==========================================
-- CX FINAL ANTI TABLES
-- ==========================================

CREATE TABLE cx_requests (
    request_id TEXT PRIMARY KEY,
    loai_yeu_cau TEXT,
    loai_dich_vu TEXT,
    ten_cong_ty TEXT,
    khu_vuc TEXT,
    loai_goi_cuoc TEXT,
    kenh_gui_tin TEXT,
    du_lieu_input TEXT,
    ngay_bat_dau DATE,
    ngay_ket_thuc DATE,
    mo_ta_nhu_cau TEXT,
    nganh_nghe TEXT,
    agent_id TEXT,
    hinh_thuc_sd TEXT,
    hinh_thuc_thanh_toan TEXT,
    email_tao_tk TEXT,
    email_phoi_hop TEXT,
    so_dien_thoai TEXT,
    ten_sale TEXT,
    sale_email TEXT,
    sale_name TEXT,
    submitted_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    phan_khuc TEXT,
    so_hop_dong TEXT,
    result_customer_id TEXT,
    cpid TEXT
);

CREATE TABLE cx_customers (
    customer_id TEXT PRIMARY KEY,
    loai_khach_hang TEXT,
    agent_id TEXT,
    trang_thai TEXT,
    request_id TEXT REFERENCES cx_requests(request_id) ON DELETE SET NULL,
    cpid TEXT,
    cp_name TEXT,
    org_id TEXT,
    ten_cong_ty TEXT,
    nganh_nghe TEXT,
    phan_khuc TEXT,
    khu_vuc TEXT,
    quoc_gia TEXT,
    kenh_gui_tin TEXT,
    du_lieu_input TEXT,
    mo_ta_nhu_cau_tu_sale TEXT,
    ngay_bat_dau_sd DATE,
    ngay_het_han_hien_tai DATE,
    email_tao_tk TEXT,
    so_dien_thoai TEXT,
    contact_phoi_hop TEXT,
    ten_tai_khoan TEXT,
    mat_khau TEXT,
    customer_success TEXT,
    customer_support TEXT,
    sale_phu_trach TEXT,
    note TEXT,
    lock_nguyen_nhan TEXT,
    created_by TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    updated_by TEXT,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

CREATE TABLE cx_contracts (
    contract_id TEXT PRIMARY KEY,
    customer_id TEXT REFERENCES cx_customers(customer_id) ON DELETE CASCADE,
    loai_hop_dong TEXT DEFAULT 'Subscription',
    so_hop_dong TEXT,
    ngay_bat_dau_hd DATE,
    ngay_ket_thuc_hd DATE,
    thoi_han_hd_ngay INTEGER,
    thoi_han_hd_nam NUMERIC,
    previous_contract_id TEXT,
    so_po TEXT,
    ngay_bat_dau_po DATE,
    ngay_ket_thuc_po DATE,
    hinh_thuc_thanh_toan TEXT,
    trang_thai TEXT,
    created_by TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    updated_by TEXT,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

CREATE TABLE cx_services (
    service_id TEXT PRIMARY KEY,
    customer_id TEXT REFERENCES cx_customers(customer_id) ON DELETE CASCADE,
    contract_id TEXT REFERENCES cx_contracts(contract_id) ON DELETE SET NULL,
    brand_id TEXT REFERENCES brands(id) ON DELETE SET NULL,
    cp_id TEXT REFERENCES cps(id) ON DELETE SET NULL,
    channel TEXT,
    usage_method TEXT,
    package_type TEXT,
    package_start_date DATE,
    package_end_date DATE,
    term_type TEXT,
    template_registration_method TEXT,
    loai_dich_vu TEXT,
    cp_name_code TEXT,
    brand_name_oa TEXT,
    thoi_han_brand DATE,
    dau_so TEXT,
    cu_phap TEXT,
    quoc_gia TEXT,
    ket_noi_api_gateway TEXT,
    ket_noi_smpp TEXT,
    ket_noi_api_gap_one TEXT,
    ket_noi_vi_zca TEXT,
    ket_noi_he_thong_kh TEXT,
    ten_service TEXT,
    trang_thai TEXT,
    ngay_bat_dau DATE,
    ngay_het_han DATE,
    sup_phu_trach TEXT,
    ghi_chu TEXT,
    created_by TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    updated_by TEXT,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    synced_at TIMESTAMP WITH TIME ZONE
);

CREATE TABLE cx_activity_logs (
    log_id TEXT PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    action TEXT,
    target_type TEXT,
    target_id TEXT,
    detail TEXT,
    performed_by TEXT,
    related_customer_id TEXT
);

CREATE TABLE cx_config (
    key TEXT PRIMARY KEY,
    value TEXT,
    description TEXT
);

ALTER PUBLICATION supabase_realtime ADD TABLE cx_requests, cx_customers, cx_contracts, cx_services;

ALTER TABLE cx_requests DISABLE ROW LEVEL SECURITY;
ALTER TABLE cx_customers DISABLE ROW LEVEL SECURITY;
ALTER TABLE cx_contracts DISABLE ROW LEVEL SECURITY;
ALTER TABLE cx_services DISABLE ROW LEVEL SECURITY;
ALTER TABLE cx_activity_logs DISABLE ROW LEVEL SECURITY;
ALTER TABLE cx_config DISABLE ROW LEVEL SECURITY;

CREATE OR REPLACE VIEW vw_cx_services_details AS
SELECT 
    s.*,
    c.ngay_ket_thuc_hd,
    COALESCE(s.package_end_date, s.ngay_het_han, c.ngay_ket_thuc_hd) as effective_service_end
FROM cx_services s
LEFT JOIN cx_contracts c ON s.contract_id = c.contract_id;
