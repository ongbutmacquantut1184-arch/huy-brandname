-- Create a table for safe ID generation
CREATE TABLE IF NOT EXISTS id_counters (
  scope TEXT PRIMARY KEY,
  current_value BIGINT NOT NULL
);

-- Function to safely generate monthly IDs (e.g., KH-2606-0001)
CREATE OR REPLACE FUNCTION generate_monthly_id(prefix TEXT)
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  yymm TEXT;
  scope_key TEXT;
  next_val BIGINT;
BEGIN
  yymm := to_char(now(), 'YYMM');
  scope_key := prefix || '-' || yymm;
  
  INSERT INTO id_counters (scope, current_value)
  VALUES (scope_key, 1)
  ON CONFLICT (scope) DO UPDATE
  SET current_value = id_counters.current_value + 1
  RETURNING current_value INTO next_val;
  
  RETURN prefix || '-' || yymm || '-' || lpad(next_val::TEXT, 4, '0');
END;
$$;

-- Function to safely generate sequence IDs (e.g., SUB-0001 or CTR-SUB-0001-1)
CREATE OR REPLACE FUNCTION generate_sequence_id(prefix TEXT)
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  next_val BIGINT;
BEGIN
  INSERT INTO id_counters (scope, current_value)
  VALUES (prefix, 1)
  ON CONFLICT (scope) DO UPDATE
  SET current_value = id_counters.current_value + 1
  RETURNING current_value INTO next_val;
  
  IF prefix LIKE 'CTR-%' THEN
    RETURN prefix || '-' || next_val::TEXT;
  ELSE
    RETURN prefix || '-' || lpad(next_val::TEXT, 4, '0');
  END IF;
END;
$$;

-- Note: Complex transactions like activate_request should ideally be moved to an RPC.
-- Here we provide an RPC for create_contract_with_services to demonstrate safe transactional inserts.
CREATE OR REPLACE FUNCTION create_contract_with_services(
  p_contract jsonb,
  p_services jsonb,
  p_actor text
) RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  v_contract_id text;
  v_service jsonb;
BEGIN
  -- Generate ID for contract
  v_contract_id := generate_sequence_id('CTR-' || (p_contract->>'customer_id'));
  
  -- Insert contract
  INSERT INTO cx_contracts (
    contract_id, customer_id, so_hop_dong, ngay_bat_dau_hd, ngay_ket_thuc_hd,
    thoi_han_hd_ngay, thoi_han_hd_nam, previous_contract_id, so_po,
    ngay_bat_dau_po, ngay_ket_thuc_po, hinh_thuc_thanh_toan, trang_thai,
    tu_dong_gia_han, chu_ky_gia_han, created_by
  ) VALUES (
    v_contract_id,
    p_contract->>'customer_id',
    p_contract->>'so_hop_dong',
    (p_contract->>'ngay_bat_dau_hd')::date,
    (p_contract->>'ngay_ket_thuc_hd')::date,
    (p_contract->>'thoi_han_hd_ngay')::int,
    (p_contract->>'thoi_han_hd_nam')::numeric,
    p_contract->>'previous_contract_id',
    p_contract->>'so_po',
    (p_contract->>'ngay_bat_dau_po')::date,
    (p_contract->>'ngay_ket_thuc_po')::date,
    p_contract->>'hinh_thuc_thanh_toan',
    p_contract->>'trang_thai',
    (p_contract->>'tu_dong_gia_han')::boolean,
    (p_contract->>'chu_ky_gia_han')::int,
    p_actor
  );

  -- Insert activity log for contract
  INSERT INTO cx_activity_logs (log_id, action, target_type, target_id, detail, performed_by, related_customer_id)
  VALUES (
    'LOG-' || (extract(epoch from now()) * 1000)::bigint::text,
    'CREATE', 'contract', v_contract_id, 'Tạo hợp đồng mới', p_actor, p_contract->>'customer_id'
  );

  -- Loop and insert services
  FOR v_service IN SELECT * FROM jsonb_array_elements(p_services)
  LOOP
    INSERT INTO cx_services (
      service_id, contract_id, customer_id, loai_dich_vu, hang_muc, sub_hang_muc,
      goi_cuoc, chu_ky_thanh_toan, don_gia, so_luong, thanh_tien, don_vi_tien_te,
      ngay_bat_dau, ngay_het_han, ngay_nghiem_thu, sup_phu_trach,
      brand_name_oa, cp_name_code, trang_thai, created_by
    ) VALUES (
      generate_monthly_id('SVC'),
      v_contract_id,
      p_contract->>'customer_id',
      v_service->>'loai_dich_vu',
      v_service->>'hang_muc',
      v_service->>'sub_hang_muc',
      v_service->>'goi_cuoc',
      v_service->>'chu_ky_thanh_toan',
      (v_service->>'don_gia')::numeric,
      (v_service->>'so_luong')::int,
      (v_service->>'thanh_tien')::numeric,
      v_service->>'don_vi_tien_te',
      (v_service->>'ngay_bat_dau')::date,
      (v_service->>'ngay_het_han')::date,
      (v_service->>'ngay_nghiem_thu')::date,
      v_service->>'sup_phu_trach',
      v_service->>'brand_name_oa',
      v_service->>'cp_name_code',
      v_service->>'trang_thai',
      p_actor
    );
  END LOOP;

  RETURN v_contract_id;
END;
$$;
