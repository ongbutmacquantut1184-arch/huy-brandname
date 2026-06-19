"use server";

import { supabase } from './supabase';

/**
 * Sinh ID theo format PREFIX-{YYMM}-{NNNN}
 */
async function generateMonthlyId(prefix: string) {
  // Vì Supabase không hỗ trợ transaction tự tăng string ID dễ dàng mà không dùng RPC, 
  // ta sẽ query ID lớn nhất trong tháng hiện tại và cộng 1.
  const { data, error } = await supabase.rpc('generate_monthly_id', { prefix });
  if (error) throw new Error(error.message);
  return data;
}

/**
 * Sinh customerId: SUB-xxxx hoặc CAM-xxxx
 */
async function generateCustomerId(loaiKH: string) {
  const prefix = loaiKH.toLowerCase().includes('subscription') ? 'SUB' : 'CAM';
  for (let i = 0; i < 5; i++) {
    const { data, error } = await supabase.rpc('generate_sequence_id', { prefix });
    if (error) throw new Error(error.message);
    
    const { data: existing } = await supabase.from('cx_customers').select('customer_id').eq('customer_id', data).single();
    if (!existing) {
      return data;
    }
  }
  throw new Error('Không thể tạo ID Khách hàng duy nhất. Vui lòng thử lại.');
}

/**
 * Sinh contractId: CTR-{customerId}-{n}
 */
async function generateContractId(customerId: string) {
  const prefix = `CTR-${customerId}`;
  const { data, error } = await supabase.rpc('generate_sequence_id', { prefix });
  if (error) throw new Error(error.message);
  return data;
}

/**
 * Sinh serviceId: SUP-{customerId}-{YYMMDDHHmm}
 */
function generateServiceId(customerId: string) {
  const now = new Date();
  const yy = String(now.getFullYear()).slice(-2);
  const MM = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  const HH = String(now.getHours()).padStart(2, '0');
  const mm = String(now.getMinutes()).padStart(2, '0');
  return `SUP-${customerId}-${yy}${MM}${dd}${HH}${mm}`;
}

// =======================
// ACTIONS
// =======================

export async function createPendingRequest(data: any) {
  try {
    const requestId = await generateMonthlyId('REQ');

    const reqData = {
      request_id: requestId,
      loai_khach_hang: data.loaiKhachHang,
      ten_cong_ty: data.tenCongTy?.trim(),
      khu_vuc: data.khuVuc,
      loai_goi_cuoc: data.loaiGoiCuoc,
      kenh_gui_tin: data.kenhGuiTin,
      du_lieu_input: data.duLieuInput,
      ngay_bat_dau: data.ngayBatDau,
      ngay_ket_thuc: data.ngayKetThuc,
      mo_ta_nhu_cau: data.moTaNhuCau?.trim(),
      nganh_nghe: data.nganhNghe,
      agent_id: data.agentId,
      hinh_thuc_sd: data.hinhThucSD,
      hinh_thuc_thanh_toan: data.hinhThucThanhToan,
      email_tao_tk: data.emailTaoTK?.trim(),
      email_phoi_hop: data.emailPhoiHop?.trim(),
      so_dien_thoai: data.soDienThoai?.trim(),
      ten_sale: data.tenSale,
      sale_email: data.saleEmail || '',
      sale_name: data.tenSale,
      phan_khuc: data.phanKhuc,
      so_hop_dong: data.soHopDong,
      cpid: data.cpid,
    };

    const { error } = await supabase.from('cx_requests').insert([reqData]);
    if (error) throw error;

    return { success: true, requestId };
  } catch (error: any) {
    console.error('createPendingRequest error:', error);
    return { success: false, error: error.message };
  }
}

export async function getPendingRequests() {
  const { data, error } = await supabase
    .from('cx_requests')
    .select('*')
    .is('result_customer_id', null)
    .order('submitted_at', { ascending: false });

  if (error) return { success: false, error: error.message };
  return { success: true, data };
}

export async function getContracts() {
  const { data: contracts, error } = await supabase
    .from('cx_contracts')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) return { success: false, error: error.message };
  
  if (contracts && contracts.length > 0) {
    const customerIds = [...new Set(contracts.map(c => c.customer_id).filter(Boolean))];
    const contractIds = contracts.map(c => c.contract_id);

    const [{ data: customers }, { data: services }] = await Promise.all([
      supabase.from('cx_customers').select('customer_id, ten_cong_ty, org_id, sale_in_charge, cs_in_charge, sale_phu_trach, customer_success').in('customer_id', customerIds),
      supabase.from('cx_services').select('service_id, contract_id').in('contract_id', contractIds)
    ]);

    const custMap = (customers || []).reduce((acc: any, curr) => {
      acc[curr.customer_id] = curr;
      return acc;
    }, {});

    const srvMap = (services || []).reduce((acc: any, curr) => {
      if (curr.contract_id) {
        if (!acc[curr.contract_id]) acc[curr.contract_id] = 0;
        acc[curr.contract_id]++;
      }
      return acc;
    }, {});

    const mapped = contracts.map(c => ({
      ...c,
      ten_cong_ty: custMap[c.customer_id]?.ten_cong_ty || '',
      org_id: custMap[c.customer_id]?.org_id || '',
      sale_in_charge: custMap[c.customer_id]?.sale_in_charge || custMap[c.customer_id]?.sale_phu_trach || '',
      cs_in_charge: custMap[c.customer_id]?.cs_in_charge || custMap[c.customer_id]?.customer_success || '',
      total_services: srvMap[c.contract_id] || 0
    }));

    return { success: true, data: mapped };
  }

  return { success: true, data: [] };
}

export async function getServices() {
  const { data, error } = await supabase
    .from('cx_services')
    .select('*, cx_customers(ten_cong_ty, org_id, customer_support)')
    .order('created_at', { ascending: false });

  if (error) return { success: false, error: error.message };
  return { success: true, data };
}

export async function checkEmailExists(email: string) {
  const { data, error } = await supabase
    .from('cx_customers')
    .select('customer_id')
    .eq('email_tao_tk', email)
    .limit(1);

  if (error) return { success: false, error: error.message };
  return { success: true, exists: data && data.length > 0 };
}

export async function getRequestById(requestId: string) {
  const { data, error } = await supabase
    .from('cx_requests')
    .select('*')
    .eq('request_id', requestId)
    .single();

  if (error) return { success: false, error: error.message };
  return { success: true, data };
}

export async function activateRequest(data: any) {
  try {
    if (!data.requestId) throw new Error('Thiếu mã phiếu (requestId)');

    // 1. Fetch request
    const { data: reqs, error: reqErr } = await supabase
      .from('cx_requests')
      .select('*')
      .eq('request_id', data.requestId);
    
    if (reqErr || !reqs || reqs.length === 0) throw new Error('Không tìm thấy phiếu');
    const req = reqs[0];
    if (req.result_customer_id) throw new Error(`Phiếu đã được kích hoạt: ${req.result_customer_id}`);

    // 2. Sinh ID
    const customerId = await generateCustomerId(req.loai_khach_hang);
    const contractId = await generateContractId(customerId);

    // 3. Tính toán ngày cho Hợp đồng
    const d1 = new Date(req.ngay_bat_dau);
    const d2 = new Date(req.ngay_ket_thuc);
    const thoiHanNgay = Math.ceil((d2.getTime() - d1.getTime()) / 86400000);
    const thoiHanNam = Math.round(thoiHanNgay / 36.5) / 10;

    // 4. Insert Customer
    const custData = {
      customer_id: customerId,
      loai_khach_hang: req.loai_khach_hang,
      agent_id: req.agent_id,
      trang_thai: 'Active',
      request_id: req.request_id,
      cpid: data.cpid || req.cpid,
      cp_name: data.cpName,
      org_id: data.orgId,
      ten_cong_ty: req.ten_cong_ty,
      nganh_nghe: data.nganhNghe || req.nganh_nghe,
      phan_khuc: data.phanKhuc || req.phan_khuc,
      khu_vuc: req.khu_vuc,
      quoc_gia: data.quocGia,
      kenh_gui_tin: data.kenhGuiTin || req.kenh_gui_tin,
      du_lieu_input: data.duLieuInput || req.du_lieu_input,
      mo_ta_nhu_cau_tu_sale: req.mo_ta_nhu_cau,
      ngay_bat_dau_sd: req.ngay_bat_dau,
      ngay_het_han_hien_tai: req.ngay_ket_thuc,
      email_tao_tk: req.email_tao_tk,
      so_dien_thoai: data.soDienThoai || req.so_dien_thoai,
      contact_phoi_hop: req.email_phoi_hop,
      ten_tai_khoan: data.tenTaiKhoan,
      mat_khau: data.matKhau,
      customer_success: data.customerSuccess,
      customer_support: data.customerSupport,
      sale_phu_trach: data.salePhuTrach || req.ten_sale,
      created_by: data.actorEmail || req.sale_email,
    };

    const { error: err1 } = await supabase.from('cx_customers').insert([custData]);
    if (err1) throw err1;

    // 5. Insert Contract
    const contractData = {
      contract_id: contractId,
      customer_id: customerId,
      so_hop_dong: data.soHopDong || req.so_hop_dong,
      ngay_bat_dau_hd: req.ngay_bat_dau,
      ngay_ket_thuc_hd: req.ngay_ket_thuc,
      thoi_han_hd_ngay: thoiHanNgay,
      thoi_han_hd_nam: thoiHanNam,
      so_po: data.soPO,
      ngay_bat_dau_po: data.ngayBatDauPO || null,
      ngay_ket_thuc_po: data.ngayKetThucPO || null,
      hinh_thuc_thanh_toan: data.hinhThucThanhToan || req.hinh_thuc_thanh_toan,
      trang_thai: 'Active',
      created_by: data.actorEmail || req.sale_email,
    };

    const { error: err2 } = await supabase.from('cx_contracts').insert([contractData]);
    if (err2) throw err2;

    // 6. Cập nhật Request
    await supabase.from('cx_requests')
      .update({ result_customer_id: customerId })
      .eq('request_id', req.request_id);

    // 7. Insert Log
    await supabase.from('cx_activity_logs').insert([{
      log_id: `LOG-${Date.now()}`,
      action: 'ACTIVATE',
      target_type: 'customer',
      target_id: customerId,
      detail: `Tạo KH ${customerId} + HĐ ${contractId} từ phiếu ${req.request_id}`,
      performed_by: data.actorEmail || 'system',
      related_customer_id: customerId
    }]);

    return { success: true, customerId, contractId };
  } catch (error: any) {
    console.error('activateRequest error:', error);
    return { success: false, error: error.message };
  }
}

export async function createContractWithServices(data: any) {
  try {
    const p_contract = {
      customer_id: data.customerId,
      so_hop_dong: data.soHopDong,
      ngay_bat_dau_hd: data.ngayBatDauHD,
      ngay_ket_thuc_hd: data.ngayKetThucHD,
      trang_thai: 'Active'
    };
    
    const p_services = (data.services || []).map((svc: any) => ({
      loai_dich_vu: svc.loaiDichVu,
      cp_name_code: svc.cpNameCode,
      brand_name_oa: svc.brandNameOA,
      ngay_bat_dau: svc.ngayBatDau,
      ngay_het_han: svc.ngayHetHan,
      sup_phu_trach: svc.supPhuTrach,
      trang_thai: 'Active'
    }));

    const { data: contractId, error } = await supabase.rpc('create_contract_with_services', {
      p_contract,
      p_services,
      p_actor: data.performedBy || ''
    });

    if (error) throw error;

    return { success: true, contractId, serviceIds: [] };
  } catch(error: any) {
    return { success: false, error: error.message };
  }
}

// =======================
// SYSTEM SETTINGS (CONFIG)
// =======================
export async function getDropdownConfigs() {
  const { data, error } = await supabase.from('cx_config').select('*');
  if (error) return { success: false, error: error.message, data: {} };
  
  const configMap: Record<string, string[]> = {};
  if (data) {
    for (const row of data) {
      try {
        configMap[row.key] = JSON.parse(row.value);
      } catch (e) {
        configMap[row.key] = [];
      }
    }
  }
  return { success: true, data: configMap };
}

export async function updateDropdownConfig(key: string, values: string[], description: string = '') {
  try {
    const { error } = await supabase.from('cx_config').upsert({
      key,
      value: JSON.stringify(values),
      description
    }, { onConflict: 'key' });

    if (error) throw error;
    return { success: true };
  } catch(error: any) {
    return { success: false, error: error.message };
  }
}

export async function getCustomers() {
  const { data, error } = await supabase
    .from('cx_customers')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) return { success: false, error: error.message };
  return { success: true, data };
}

export async function createContract(data: any) {
  try {
    const contractId = await generateContractId(data.customerId);
    
    const d1 = new Date(data.ngayBatDauHD);
    const d2 = new Date(data.ngayKetThucHD);
    const thoiHanNgay = Math.ceil((d2.getTime() - d1.getTime()) / 86400000);
    const thoiHanNam = Math.round(thoiHanNgay / 36.5) / 10;

    const contractData = {
      contract_id: contractId,
      customer_id: data.customerId,
      so_hop_dong: data.soHopDong || '',
      ngay_bat_dau_hd: data.ngayBatDauHD,
      ngay_ket_thuc_hd: data.ngayKetThucHD,
      thoi_han_hd_ngay: thoiHanNgay || null,
      thoi_han_hd_nam: thoiHanNam || null,
      previous_contract_id: data.previousContractId || null,
      so_po: data.soPO || '',
      ngay_bat_dau_po: data.ngayBatDauPO || null,
      ngay_ket_thuc_po: data.ngayKetThucPO || null,
      hinh_thuc_thanh_toan: data.hinhThucThanhToan || '',
      trang_thai: data.trangThai || 'Active',
      tu_dong_gia_han: data.tuDongGiaHan || false,
      chu_ky_gia_han: data.chuKyGiaHan || null,
      created_by: data.actorEmail || 'system',
    };

    const { error } = await supabase.from('cx_contracts').insert([contractData]);
    if (error) throw error;

    // Log activity
    await supabase.from('cx_activity_logs').insert([{
      log_id: `LOG-${Date.now()}`,
      action: 'CREATE_CONTRACT',
      target_type: 'contract',
      target_id: contractId,
      detail: `Tạo hợp đồng ${contractId}${data.soHopDong ? ' - ' + data.soHopDong : ''}`,
      performed_by: data.actorEmail || 'system',
      related_customer_id: data.customerId
    }]);

    return { success: true, contractId, message: `Tạo hợp đồng thành công: ${contractId}` };
  } catch (error: any) {
    console.error('createContract error:', error);
    return { success: false, error: error.message };
  }
}

export async function createService(data: any) {
  try {
    const serviceId = generateServiceId(data.customerId);
    
    const svcData = {
      service_id: serviceId,
      customer_id: data.customerId,
      contract_id: data.contractId || null,
      loai_dich_vu: data.loaiDichVu,
      cp_name_code: data.cpNameCode || '',
      brand_name_oa: data.brandNameOA || '',
      thoi_han_brand: data.thoiHanBrand || null,
      dau_so: data.dauSo || '',
      cu_phap: data.cuPhap || '',
      quoc_gia: data.quocGia || '',
      ket_noi_api_gateway: data.ketNoiAPIGateway === 'Có' || data.ketNoiAPIGateway === true ? 'Có' : '',
      ket_noi_smpp: data.ketNoiSMPP === 'Có' || data.ketNoiSMPP === true ? 'Có' : '',
      ket_noi_api_gap_one: data.ketNoiAPIGapOne || '',
      ket_noi_vi_zca: data.ketNoiViZCA || '',
      ket_noi_he_thong_kh: data.ketNoiHeThongKH || '',
      ten_service: data.tenService || '',
      trang_thai: data.trangThai || 'Active',
      ngay_bat_dau: data.ngayBatDau,
      ngay_het_han: data.ngayHetHan,
      sup_phu_trach: data.supPhuTrach,
      ghi_chu: data.ghiChu || '',
      created_by: data.actorEmail || 'system',
    };

    const { error } = await supabase.from('cx_services').insert([svcData]);
    if (error) throw error;

    // Log activity
    await supabase.from('cx_activity_logs').insert([{
      log_id: `LOG-${Date.now()}`,
      action: 'CREATE_SERVICE',
      target_type: 'service',
      target_id: serviceId,
      detail: `Tạo dịch vụ ${data.loaiDichVu} (${serviceId})`,
      performed_by: data.actorEmail || 'system',
      related_customer_id: data.customerId
    }]);

    return { success: true, serviceId, message: `Tạo dịch vụ thành công: ${serviceId}` };
  } catch (error: any) {
    console.error('createService error:', error);
    return { success: false, error: error.message };
  }
}

export async function updateContractInfo(data: any) {
  try {
    const d1 = new Date(data.ngayBatDauHD);
    const d2 = new Date(data.ngayKetThucHD);
    const thoiHanNgay = Math.ceil((d2.getTime() - d1.getTime()) / 86400000);
    const thoiHanNam = Math.round(thoiHanNgay / 36.5) / 10;

    const contractData = {
      so_hop_dong: data.soHopDong || '',
      ngay_bat_dau_hd: data.ngayBatDauHD,
      ngay_ket_thuc_hd: data.ngayKetThucHD,
      thoi_han_hd_ngay: thoiHanNgay || null,
      thoi_han_hd_nam: thoiHanNam || null,
      previous_contract_id: data.previousContractId || null,
      so_po: data.soPO || '',
      ngay_bat_dau_po: data.ngayBatDauPO || null,
      ngay_ket_thuc_po: data.ngayKetThucPO || null,
      hinh_thuc_thanh_toan: data.hinhThucThanhToan || '',
      trang_thai: data.trangThai || 'Active',
      tu_dong_gia_han: data.tuDongGiaHan || false,
      chu_ky_gia_han: data.chuKyGiaHan || null,
      updated_by: data.actorEmail || 'system',
      updated_at: new Date().toISOString()
    };

    const { error } = await supabase
      .from('cx_contracts')
      .update(contractData)
      .eq('contract_id', data.contractId);
    
    if (error) throw error;

    // Log activity
    await supabase.from('cx_activity_logs').insert([{
      log_id: `LOG-${Date.now()}`,
      action: 'UPDATE_CONTRACT',
      target_type: 'contract',
      target_id: data.contractId,
      detail: `Cập nhật hợp đồng ${data.contractId}`,
      performed_by: data.actorEmail || 'system',
      related_customer_id: data.customerId
    }]);

    return { success: true, message: `Đã cập nhật hợp đồng ${data.contractId}` };
  } catch (error: any) {
    console.error('updateContractInfo error:', error);
    return { success: false, error: error.message };
  }
}

export async function updateServiceInfo(data: any) {
  try {
    const svcData = {
      contract_id: data.contractId || null,
      loai_dich_vu: data.loaiDichVu,
      cp_name_code: data.cpNameCode || '',
      brand_name_oa: data.brandNameOA || '',
      thoi_han_brand: data.thoiHanBrand || null,
      dau_so: data.dauSo || '',
      cu_phap: data.cuPhap || '',
      quoc_gia: data.quocGia || '',
      ket_noi_api_gateway: data.ketNoiAPIGateway === 'Có' || data.ketNoiAPIGateway === true ? 'Có' : '',
      ket_noi_smpp: data.ketNoiSMPP === 'Có' || data.ketNoiSMPP === true ? 'Có' : '',
      ket_noi_api_gap_one: data.ketNoiAPIGapOne || '',
      ket_noi_vi_zca: data.ketNoiViZCA || '',
      ket_noi_he_thong_kh: data.ketNoiHeThongKH || '',
      ten_service: data.tenService || '',
      trang_thai: data.trangThai || 'Active',
      ngay_bat_dau: data.ngayBatDau,
      ngay_het_han: data.ngayHetHan,
      sup_phu_trach: data.supPhuTrach,
      ghi_chu: data.ghiChu || '',
      updated_by: data.actorEmail || 'system',
      updated_at: new Date().toISOString()
    };

    const { error } = await supabase
      .from('cx_services')
      .update(svcData)
      .eq('service_id', data.serviceId);
    
    if (error) throw error;

    // Log activity
    await supabase.from('cx_activity_logs').insert([{
      log_id: `LOG-${Date.now()}`,
      action: 'UPDATE_SERVICE',
      target_type: 'service',
      target_id: data.serviceId,
      detail: `Cập nhật dịch vụ ${data.serviceId}`,
      performed_by: data.actorEmail || 'system',
      related_customer_id: data.customerId
    }]);

    return { success: true, message: `Đã cập nhật dịch vụ ${data.serviceId}` };
  } catch (error: any) {
    console.error('updateServiceInfo error:', error);
    return { success: false, error: error.message };
  }
}

export async function updateCustomerInfo(data: any) {
  try {
    const custData = {
      loai_khach_hang: data.loaiKhachHang,
      agent_id: data.agentId || null,
      trang_thai: data.trangThai || 'Active',
      cpid: data.cpid || '',
      cp_name: data.cpName || '',
      org_id: data.orgId || '',
      ten_cong_ty: data.tenCongTy || '',
      nganh_nghe: data.nganhNghe || '',
      phan_khuc: data.phanKhuc || '',
      khu_vuc: data.khuVuc || '',
      quoc_gia: data.quocGia || '',
      kenh_gui_tin: data.kenhGuiTin || '',
      du_lieu_input: data.duLieuInput || '',
      mo_ta_nhu_cau_tu_sale: data.moTaNhuCauTuSale || '',
      ngay_bat_dau_sd: data.ngayBatDauSD || null,
      ngay_het_han_hien_tai: data.ngayHetHanHienTai || null,
      email_tao_tk: data.emailTaoTK || '',
      so_dien_thoai: data.soDienThoai || '',
      contact_phoi_hop: data.contactPhoiHop || '',
      ten_tai_khoan: data.tenTaiKhoan || '',
      mat_khau: data.matKhau || '',
      customer_success: data.customerSuccess || '',
      customer_support: data.customerSupport || '',
      sale_phu_trach: data.salePhuTrach || '',
      note: data.note || '',
      lock_nguyen_nhan: data.lockNguyenNhan || '',
      updated_by: data.actorEmail || 'system',
      updated_at: new Date().toISOString()
    };

    const { error } = await supabase
      .from('cx_customers')
      .update(custData)
      .eq('customer_id', data.customerId);
    
    if (error) throw error;

    // Log activity
    await supabase.from('cx_activity_logs').insert([{
      log_id: `LOG-${Date.now()}`,
      action: 'UPDATE_CUSTOMER',
      target_type: 'customer',
      target_id: data.customerId,
      detail: `Cập nhật khách hàng ${data.customerId}`,
      performed_by: data.actorEmail || 'system',
      related_customer_id: data.customerId
    }]);

    return { success: true, message: `Đã cập nhật khách hàng ${data.customerId}` };
  } catch (error: any) {
    console.error('updateCustomerInfo error:', error);
    return { success: false, error: error.message };
  }
}

export async function renewContract(data: any) {
  try {
    const userEmail = data.actorEmail || 'system';
    
    if (data.type === 'contract') {
      if (!data.customerId || !data.contractIdCu || !data.ngayBatDauMoi || !data.ngayKetThucMoi) {
        throw new Error('Thiếu dữ liệu bắt buộc để gia hạn hợp đồng (customerId, contractIdCu, ngayBatDauMoi, ngayKetThucMoi)');
      }
    }

    if (data.type === 'service') {
      // Gia hạn dịch vụ (Service)
      const { data: svc, error: svcErr } = await supabase
        .from('cx_services')
        .select('*')
        .eq('service_id', data.targetId)
        .single();
      
      if (svcErr || !svc) throw new Error(`Không tìm thấy dịch vụ ${data.targetId}`);

      const { error } = await supabase
        .from('cx_services')
        .update({
          ngay_bat_dau: data.ngayBatDauMoi,
          ngay_het_han: data.ngayKetThucMoi,
          trang_thai: 'Active',
          ghi_chu: data.ghiChu || svc.ghi_chu || '',
          updated_by: userEmail,
          updated_at: new Date().toISOString()
        })
        .eq('service_id', data.targetId);

      if (error) throw error;

      // Log activity
      await supabase.from('cx_activity_logs').insert([{
        log_id: `LOG-${Date.now()}`,
        action: 'RENEW',
        target_type: 'service',
        target_id: data.targetId,
        detail: `Gia hạn dịch vụ đến ${data.ngayKetThucMoi}`,
        performed_by: userEmail,
        related_customer_id: data.customerId
      }]);

      return { success: true, serviceId: data.targetId, message: `Gia hạn dịch vụ thành công → ${data.targetId}` };
    } else {
      // Gia hạn hợp đồng (Contract)
      const newContractId = await generateContractId(data.customerId);
      const d1 = new Date(data.ngayBatDauMoi);
      const d2 = new Date(data.ngayKetThucMoi);
      const thoiHanNgay = Math.ceil((d2.getTime() - d1.getTime()) / 86400000);
      const thoiHanNam = Math.round(thoiHanNgay / 36.5) / 10;

      const contractData = {
        contract_id: newContractId,
        customer_id: data.customerId,
        so_hop_dong: data.soHopDong || '',
        ngay_bat_dau_hd: data.ngayBatDauMoi,
        ngay_ket_thuc_hd: data.ngayKetThucMoi,
        thoi_han_hd_ngay: thoiHanNgay || null,
        thoi_han_hd_nam: thoiHanNam || null,
        previous_contract_id: data.contractIdCu || null,
        so_po: data.soPO || '',
        ngay_bat_dau_po: data.ngayBatDauPO || null,
        ngay_ket_thuc_po: data.ngayKetThucPO || null,
        hinh_thuc_thanh_toan: data.hinhThucThanhToan || '',
        trang_thai: 'Active',
        tu_dong_gia_han: data.tuDongGiaHan || false,
        chu_ky_gia_han: data.chuKyGiaHan || null,
        created_by: userEmail,
      };

      const { error: err1 } = await supabase.from('cx_contracts').insert([contractData]);
      if (err1) throw err1;

      // Clone toàn bộ dịch vụ thuộc hợp đồng cũ
      if (data.contractIdCu) {
        const { data: oldServices } = await supabase.from('cx_services').select('*').eq('contract_id', data.contractIdCu);
        if (oldServices && oldServices.length > 0) {
          const newServices = oldServices.map((svc, index) => {
            const { id, created_at, updated_at, ...rest } = svc;
            return {
              ...rest,
              service_id: generateServiceId(data.customerId) + '-' + index,
              contract_id: newContractId,
              ngay_bat_dau: data.ngayBatDauMoi,
              ngay_het_han: data.ngayKetThucMoi,
              trang_thai: 'Active',
              created_by: userEmail
            };
          });
          const { error: cloneErr } = await supabase.from('cx_services').insert(newServices);
          if (cloneErr) console.error("Error cloning services: ", cloneErr);
        }
        
        // Cập nhật hợp đồng cũ thành Expired
        await supabase.from('cx_contracts').update({ trang_thai: 'Expired' }).eq('contract_id', data.contractIdCu);
      }

      // Cập nhật customer: ngay_het_han_hien_tai + trang_thai
      const { error: err2 } = await supabase
        .from('cx_customers')
        .update({
          ngay_het_han_hien_tai: data.ngayKetThucMoi,
          trang_thai: 'Active',
          updated_by: userEmail,
          updated_at: new Date().toISOString()
        })
        .eq('customer_id', data.customerId);
      
      if (err2) throw err2;

      // Log activity
      await supabase.from('cx_activity_logs').insert([{
        log_id: `LOG-${Date.now()}`,
        action: 'RENEW',
        target_type: 'contract',
        target_id: newContractId,
        detail: `Gia hạn HĐ ${data.contractIdCu} → ${newContractId}`,
        performed_by: userEmail,
        related_customer_id: data.customerId
      }]);

      return { success: true, contractId: newContractId, message: `Gia hạn thành công → ${newContractId}` };
    }
  } catch (error: any) {
    console.error('renewContract error:', error);
    return { success: false, error: error.message };
  }
}

export async function getServicesByContractId(contractId: string) {
  try {
    const { data, error } = await supabase
      .from('cx_services')
      .select('*')
      .eq('contract_id', contractId)
      .order('created_at', { ascending: false });
      
    if (error) throw error;
    return { success: true, data: data || [] };
  } catch (error: any) {
    console.error('getServicesByContractId error:', error);
    return { success: false, error: error.message };
  }
}

export async function getContractsByCustomerId(customerId: string) {
  try {
    const { data, error } = await supabase
      .from('cx_contracts')
      .select('*')
      .eq('customer_id', customerId)
      .order('created_at', { ascending: false });
      
    if (error) throw error;
    return { success: true, data: data || [] };
  } catch (error: any) {
    console.error('getContractsByCustomerId error:', error);
    return { success: false, error: error.message };
  }
}

// =======================
// CUSTOMER 360 & LOOKUP
// =======================

export async function searchCustomers(query: string) {
  try {
    const qClean = query.trim();
    const searchPattern = `%${qClean.replace(/\s+/g, '%')}%`;
    
    const { data, error } = await supabase.rpc('search_customers_fast', { q: qClean, limit_count: 20 });
    if (error) throw new Error(error.message);
    
    return { success: true, data };
  } catch (error: any) {
    console.error('searchCustomers error:', error);
    return { success: false, error: error.message };
  }
}

export async function getCustomer360(customerId: string) {
  try {
    const [
      { data: customer },
      { data: contracts },
      { data: services },
      { data: requests }
    ] = await Promise.all([
      supabase.from('cx_customers').select('*').eq('customer_id', customerId).single(),
      supabase.from('cx_contracts').select('*').eq('customer_id', customerId).order('created_at', { ascending: false }),
      supabase.from('cx_services').select('*').eq('customer_id', customerId).order('created_at', { ascending: false }),
      supabase.from('cx_requests').select('*').eq('result_customer_id', customerId).order('submitted_at', { ascending: false })
    ]);
    
    return { 
      success: true, 
      data: {
        customer: customer || null,
        contracts: contracts || [],
        services: services || [],
        requests: requests || []
      }
    };
  } catch (error: any) {
    console.error('getCustomer360 error:', error);
    return { success: false, error: error.message };
  }
}

export async function getCustomersOverview() {
  try {
    const { data: customers, error } = await supabase
      .from('cx_customers')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    
    const customerIds = (customers || []).map(c => c.customer_id);
    
    const [ {data: contracts}, {data: services} ] = await Promise.all([
      supabase.from('cx_contracts').select('*').in('customer_id', customerIds),
      supabase.from('cx_services').select('*').in('customer_id', customerIds)
    ]);
    
    const contractsMap = new Map<string, any[]>();
    (contracts || []).forEach(ct => {
      if (!contractsMap.has(ct.customer_id)) contractsMap.set(ct.customer_id, []);
      contractsMap.get(ct.customer_id)!.push(ct);
    });

    const servicesMap = new Map<string, any[]>();
    (services || []).forEach(s => {
      if (!servicesMap.has(s.customer_id)) servicesMap.set(s.customer_id, []);
      servicesMap.get(s.customer_id)!.push(s);
    });
    
    const mapped = (customers || []).map(c => {
      const cContracts = contractsMap.get(c.customer_id) || [];
      const cServices = servicesMap.get(c.customer_id) || [];
      
      const searchText = [
        c.customer_id,
        c.ten_cong_ty,
        c.ma_so_thue,
        c.org_id,
        c.cpid,
        c.cp_name,
        ...cServices.map(s => s.brand_name_oa),
        ...cServices.map(s => s.cp_name_code),
        ...cServices.map(s => s.service_id)
      ].filter(Boolean).join(' ').toLowerCase();
      
      return {
        ...c,
        contracts: cContracts,
        services: cServices,
        total_contracts: cContracts.length,
        total_services: cServices.length,
        active_services: cServices.filter(s => s.trang_thai === 'Active').length,
        service_types: Array.from(new Set(cServices.map(s => s.loai_dich_vu).filter(Boolean))),
        sup_phu_trach_list: Array.from(new Set(cServices.map(s => s.sup_phu_trach).filter(Boolean))),
        service_expiries: cServices.map(s => s.ngay_het_han).filter(Boolean),
        trang_thai: cServices.some(s => s.trang_thai === 'Active') ? 'Active' : 'Inactive',
        searchText
      };
    });
    
    return { success: true, data: mapped };
  } catch (error: any) {
    console.error('getCustomersOverview error:', error);
    return { success: false, error: error.message };
  }
}

export async function processAutoRenewContracts() {
  try {
    // Tìm các hợp đồng Active có tu_dong_gia_han = true và sắp hết hạn (trong vòng 7 ngày)
    const today = new Date();
    const futureLimit = new Date();
    futureLimit.setDate(today.getDate() + 7);
    
    const { data: contracts, error } = await supabase
      .from('cx_contracts')
      .select('*')
      .eq('tu_dong_gia_han', true)
      .eq('trang_thai', 'Active')
      .lte('ngay_ket_thuc_hd', futureLimit.toISOString().split('T')[0]);

    if (error) throw error;
    if (!contracts || contracts.length === 0) {
      return { success: true, processedCount: 0, message: 'Không có hợp đồng nào cần gia hạn tự động' };
    }

    let processedCount = 0;

    for (const c of contracts) {
      const chuKy = c.chu_ky_gia_han || 12; // Mặc định 12 tháng
      
      // Tính ngày bắt đầu mới = ngày kết thúc cũ + 1 ngày
      const oldEnd = new Date(c.ngay_ket_thuc_hd);
      const newStart = new Date(oldEnd);
      newStart.setDate(oldEnd.getDate() + 1);
      
      // Tính ngày kết thúc mới
      const newEnd = new Date(newStart);
      newEnd.setMonth(newStart.getMonth() + chuKy);
      
      const payload = {
        type: 'contract',
        customerId: c.customer_id,
        contractIdCu: c.contract_id,
        ngayBatDauMoi: newStart.toISOString().split('T')[0],
        ngayKetThucMoi: newEnd.toISOString().split('T')[0],
        actorEmail: 'system_auto_renew',
        tuDongGiaHan: true,
        chuKyGiaHan: chuKy
      };
      
      const res = await renewContract(payload);
      if (res.success) {
        processedCount++;
      } else {
        console.error(`Lỗi tự động gia hạn hợp đồng ${c.contract_id}:`, res.error);
      }
    }

    return { success: true, processedCount, message: `Đã xử lý ${processedCount} hợp đồng tự động gia hạn` };
  } catch (error: any) {
    console.error('processAutoRenewContracts error:', error);
    return { success: false, error: error.message };
  }
}
