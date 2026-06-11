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
