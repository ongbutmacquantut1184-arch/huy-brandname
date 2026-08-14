-- 1. Tạo bảng cx_accounts mới
CREATE TABLE IF NOT EXISTS cx_accounts (
    account_id TEXT PRIMARY KEY,
    customer_id TEXT REFERENCES cx_customers(customer_id) ON DELETE CASCADE,
    ten_tai_khoan TEXT,
    mat_khau TEXT,
    email_tao_tk TEXT,
    trang_thai TEXT,
    ngay_het_han DATE,
    created_by TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    updated_by TEXT,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 2. Di chuyển dữ liệu tài khoản hiện có từ cx_customers sang cx_accounts
INSERT INTO cx_accounts (account_id, customer_id, ten_tai_khoan, mat_khau, email_tao_tk, trang_thai, created_by)
SELECT 
    'ACC-' || customer_id as account_id, 
    customer_id, 
    ten_tai_khoan, 
    mat_khau, 
    email_tao_tk, 
    'Active', 
    'system'
FROM cx_customers
WHERE email_tao_tk IS NOT NULL OR ten_tai_khoan IS NOT NULL
ON CONFLICT (account_id) DO NOTHING;

-- 3. Cập nhật bảng cx_services
ALTER TABLE cx_services ADD COLUMN IF NOT EXISTS account_id TEXT REFERENCES cx_accounts(account_id) ON DELETE SET NULL;

DO $$ 
BEGIN
  IF EXISTS(SELECT 1 FROM information_schema.columns WHERE table_name='cx_services' AND column_name='sup_phu_trach') THEN
    ALTER TABLE cx_services RENAME COLUMN sup_phu_trach TO customer_support;
  END IF;
END $$;

-- 4. Loại bỏ các cột không còn sử dụng trong cx_customers
ALTER TABLE cx_customers 
DROP COLUMN IF EXISTS email_tao_tk,
DROP COLUMN IF EXISTS ten_tai_khoan,
DROP COLUMN IF EXISTS mat_khau,
DROP COLUMN IF EXISTS customer_support;

-- 5. Cấp quyền truy cập Realtime (nếu có)
DO $$
BEGIN
    -- Check if publication exists before trying to add table to it
    IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
        BEGIN
            ALTER PUBLICATION supabase_realtime ADD TABLE cx_accounts;
        EXCEPTION WHEN duplicate_object THEN
            -- Table is already in the publication
            NULL;
        END;
    END IF;
END $$;
