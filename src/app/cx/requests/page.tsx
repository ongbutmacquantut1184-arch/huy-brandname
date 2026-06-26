"use client";

import React, { useState, useEffect, useRef } from 'react';
import { Search, Filter, X, ChevronDown, CheckCircle, Info, FileText, ChevronRight, CheckSquare, Eye, EyeOff } from 'lucide-react';
import { getRequestById, activateRequest, getDropdownConfigs } from '@/lib/cx-actions';
import { DROPDOWNS as FALLBACK_DROPDOWNS } from '@/lib/constants';

export default function CSRateAccountPage() {
  const [searchId, setSearchId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const errorRef = useRef<HTMLDivElement>(null);
  
  const [requestData, setRequestData] = useState<any>(null);
  const [isAlreadyCreated, setIsAlreadyCreated] = useState(false);
  
  const [dropdowns, setDropdowns] = useState<Record<string, string[]>>(FALLBACK_DROPDOWNS);
  const [successInfo, setSuccessInfo] = useState<any>(null);
  const [showSuccessPwd, setShowSuccessPwd] = useState(false);
  const successRef = useRef<HTMLDivElement>(null);

  const handleCopyAll = () => {
    if (!successInfo) return;
    const text = `Tên tài khoản: ${successInfo.tenTaiKhoan}\nMật khẩu: ${successInfo.matKhau}\nOrg Id: ${successInfo.orgId}\nHình thức thanh toán: ${successInfo.hinhThucThanhToan}\nNgày bắt đầu: ${successInfo.ngayBatDau}\nNgày kết thúc: ${successInfo.ngayKetThuc}\nMã Hợp đồng: ${successInfo.contractId}\nMã Khách hàng: ${successInfo.customerId}\n\n⚠️ Có hợp đồng mới được tạo. Vui lòng vào hệ thống để hoàn tất thông tin Hợp đồng và tạo Dịch vụ tương ứng.`;
    navigator.clipboard.writeText(text);
    alert('Đã copy toàn bộ thông tin!');
  };

  useEffect(() => {
    async function loadConfigs() {
      const res = await getDropdownConfigs();
      if (res.success && res.data) {
        const data = res.data as Record<string, string[]>;
        const merged: Record<string, string[]> = { ...FALLBACK_DROPDOWNS };
        for (const key in FALLBACK_DROPDOWNS) {
          if (data[key] && data[key].length > 0) {
            merged[key] = data[key];
          }
        }
        setDropdowns(merged);
      }
    }
    loadConfigs();
  }, []);

  const [formData, setFormData] = useState({
    requestId: '',
    loaiYeuCau: '',
    tenCongTy: '',
    khuVuc: '',
    loaiGoiCuoc: '',
    kenhGuiTin: '',
    ngayBatDau: '',
    ngayKetThuc: '',
    moTaNhuCau: '',
    nganhNghe: '',
    agentId: '',
    hinhThucSD: '',
    hinhThucThanhToan: '',
    emailTaoTK: '',
    emailPhoiHop: '',
    soDienThoai: '',
    tenSale: '',
    phanKhuc: '',
    soHopDong: '',
    cpid: '',
    duLieuInput: '',
    
    // CS Fields
    tenTaiKhoan: '',
    matKhau: '',
    orgId: '',
    customerSuccess: [] as string[],
    customerSupport: [] as string[],
  });

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchId.trim()) return;
    
    setLoading(true);
    setError('');
    setRequestData(null);
    setSuccessInfo(null);
    setIsAlreadyCreated(false);

    const res = await getRequestById(searchId.trim());
    if (res.success && res.data) {
      const req = res.data;
      setRequestData(req);
      
      if (req.result_customer_id) {
        setIsAlreadyCreated(true);
      }

      setFormData({
        requestId: req.request_id,
        loaiYeuCau: req.loai_yeu_cau || '',
        tenCongTy: req.ten_cong_ty || '',
        khuVuc: req.khu_vuc || '',
        loaiGoiCuoc: req.loai_goi_cuoc || '',
        kenhGuiTin: req.kenh_gui_tin || '',
        ngayBatDau: req.ngay_bat_dau || '',
        ngayKetThuc: req.ngay_ket_thuc || '',
        moTaNhuCau: req.mo_ta_nhu_cau || '',
        nganhNghe: req.nganh_nghe || '',
        agentId: req.agent_id || '',
        hinhThucSD: req.hinh_thuc_sd || '',
        hinhThucThanhToan: req.hinh_thuc_thanh_toan || '',
        emailTaoTK: req.email_tao_tk || '',
        emailPhoiHop: req.email_phoi_hop || '',
        soDienThoai: req.so_dien_thoai || '',
        tenSale: req.ten_sale || '',
        phanKhuc: req.phan_khuc || '',
        soHopDong: req.so_hop_dong || '',
        cpid: req.cpid || '',
        duLieuInput: req.du_lieu_input || '',
        
        // Trống để CS điền
        tenTaiKhoan: '',
        matKhau: '',
        orgId: '',
        customerSuccess: [],
        customerSupport: [],
      });
    } else {
      setError('Không tìm thấy mã phiếu yêu cầu này.');
    }
    setLoading(false);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const toggleChip = (field: 'customerSuccess' | 'customerSupport', option: string) => {
    setFormData(prev => {
      const arr = prev[field];
      if (arr.includes(option)) {
        return { ...prev, [field]: arr.filter(x => x !== option) };
      } else {
        return { ...prev, [field]: [...arr, option] };
      }
    });
  };

  const handleCreateAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isAlreadyCreated) return;
    
    setLoading(true);
    setError('');

    const payload = {
      ...formData,
      customerSuccess: formData.customerSuccess.join(', '),
      customerSupport: formData.customerSupport.join(', '),
      actorEmail: 'admin@system.local'
    };

    const res = await activateRequest(payload);

    if (res.success) {
      setSuccessInfo({
        tenTaiKhoan: formData.tenTaiKhoan,
        matKhau: formData.matKhau,
        orgId: formData.orgId,
        hinhThucThanhToan: formData.hinhThucThanhToan,
        ngayBatDau: formData.ngayBatDau,
        ngayKetThuc: formData.ngayKetThuc,
        customerId: res.customerId,
        contractId: res.contractId,
        createdServicesCount: res.createdServicesCount || 0
      });
      setIsAlreadyCreated(true);
      setTimeout(() => successRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 100);
    } else {
      setError(res.error || 'Có lỗi xảy ra khi tạo khách hàng.');
      setTimeout(() => errorRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 100);
    }
    setLoading(false);
  };

  return (
    <div style={{ maxWidth: '1000px', margin: '40px auto', padding: '24px' }}>
      <h1 style={{ fontSize: '28px', fontWeight: 600, color: '#111', marginBottom: '24px' }}>Tạo tài khoản từ Phiếu yêu cầu</h1>
      
      {/* Search Bar */}
      <div style={{ background: '#fff', borderRadius: '12px', padding: '24px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', marginBottom: '24px' }}>
        <form onSubmit={handleSearch} style={{ display: 'flex', gap: '16px' }}>
          <input 
            type="text" 
            placeholder="Nhập mã phiếu yêu cầu (VD: REQ-171842000)" 
            value={searchId}
            onChange={(e) => setSearchId(e.target.value)}
            style={{ flex: 1, padding: '14px', borderRadius: '8px', border: '1px solid #d1d5db', fontSize: '15px', outline: 'none' }}
          />
          <button type="submit" disabled={loading} className="btn btn-primary">
            Tìm kiếm
          </button>
        </form>
      </div>

      {error && <div ref={errorRef} style={{ padding: '16px', background: '#fee2e2', color: '#991b1b', borderRadius: '8px', marginBottom: '24px' }}>{error}</div>}

      {/* Success Info Block Moved to Bottom */}

      {/* Warning if already created */}
      {isAlreadyCreated && requestData && !successInfo && (
        <div style={{ padding: '16px', background: '#fffbeb', color: '#b45309', border: '1px solid #fde68a', borderRadius: '8px', marginBottom: '24px', fontWeight: 500 }}>
          ⚠️ CẢNH BÁO: Phiếu yêu cầu này đã được tạo tài khoản (Mã KH: {requestData.result_customer_id}). Bạn không thể tạo lại.
        </div>
      )}

      {/* Review Form */}
      {requestData && (
        <form onSubmit={handleCreateAccount} style={{ background: '#fff', borderRadius: '12px', padding: '32px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', display: 'flex', flexDirection: 'column', gap: '32px', opacity: isAlreadyCreated && !successInfo ? 0.6 : 1, pointerEvents: isAlreadyCreated && !successInfo ? 'none' : 'auto' }}>
          
          {/* PHẦN 1: REVIEW THÔNG TIN SALE */}
          <h2 style={{ fontSize: '20px', fontWeight: 600, borderBottom: '1px solid #eaeaea', paddingBottom: '12px' }}>Phần 1: Thông tin từ Phiếu yêu cầu (Có thể chỉnh sửa)</h2>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={gridStyle}>
              <div>
                <label style={labelStyle}>Tên công ty</label>
                <input type="text" name="tenCongTy" value={formData.tenCongTy} onChange={handleChange} style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Email tạo TK</label>
                <input type="text" name="emailTaoTK" value={formData.emailTaoTK} onChange={handleChange} style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Số điện thoại</label>
                <input type="text" name="soDienThoai" value={formData.soDienThoai} onChange={handleChange} style={inputStyle} />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div>
                <label style={labelStyle}>Ngày bắt đầu</label>
                <input type="date" onClick={(e) => (e.target as any).showPicker && (e.target as any).showPicker()} name="ngayBatDau" value={formData.ngayBatDau} onChange={handleChange} style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Ngày kết thúc</label>
                <input type="date" onClick={(e) => (e.target as any).showPicker && (e.target as any).showPicker()} name="ngayKetThuc" value={formData.ngayKetThuc} onChange={handleChange} style={inputStyle} />
              </div>
            </div>

            <div style={gridStyle}>
              <div>
                <label style={labelStyle}>Loại yêu cầu</label>
                <select name="loaiYeuCau" value={formData.loaiYeuCau} onChange={handleChange} style={inputStyle}>
                  <option value="Subscription">Subscription</option>
                  <option value="Campaign">Campaign</option>
                </select>
              </div>
              <div>
                <label style={labelStyle}>Hình thức thanh toán</label>
                <select name="hinhThucThanhToan" value={formData.hinhThucThanhToan} onChange={handleChange} style={inputStyle}>
                  <option value="">-- Chọn --</option>
                  {dropdowns.hinhThucThanhToan.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                </select>
              </div>
            </div>

            <div style={gridStyle}>
              <div>
                <label style={labelStyle}>Kênh gửi tin (Sale nhập)</label>
                <input type="text" name="kenhGuiTin" value={formData.kenhGuiTin} onChange={handleChange} style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Dữ liệu đầu vào (Sale nhập)</label>
                <input type="text" name="duLieuInput" value={formData.duLieuInput} onChange={handleChange} style={inputStyle} />
              </div>
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '16px' }}>
              <div>
                <label style={labelStyle}>Mô tả nhu cầu (Sale ghi)</label>
                <textarea name="moTaNhuCau" value={formData.moTaNhuCau} onChange={handleChange} style={{ ...inputStyle, minHeight: '80px' }} />
              </div>
            </div>
          </div>

          {/* PHẦN 2: BỔ SUNG THÔNG TIN CS (Chỉ hiển thị cho phần mềm Subscription) */}
          {formData.loaiYeuCau === 'Subscription' && (
            <>
              <h2 style={{ fontSize: '20px', fontWeight: 600, borderBottom: '1px solid #eaeaea', paddingBottom: '12px', marginTop: '16px' }}>Phần 2: Bổ sung thông tin CS (Bắt buộc cho Subscription)</h2>
              <div style={gridStyle}>
                <div>
                  <label style={labelStyle}>Tên tài khoản <span style={{ color: 'red' }}>*</span></label>
                  <input type="text" name="tenTaiKhoan" value={formData.tenTaiKhoan} onChange={handleChange} required style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>Mật khẩu <span style={{ color: 'red' }}>*</span></label>
                  <input type="text" name="matKhau" value={formData.matKhau} onChange={handleChange} required style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>Org ID <span style={{ color: 'red' }}>*</span></label>
                  <input type="text" name="orgId" value={formData.orgId} onChange={handleChange} required style={inputStyle} />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                <div>
                  <label style={labelStyle}>Customer Success (Chọn nhiều)</label>
                  <div style={chipGridStyle}>
                    {dropdowns.customerSuccess.map(opt => (
                      <div 
                        key={opt}
                        onClick={() => toggleChip('customerSuccess', opt)}
                        style={{
                          ...chipStyle,
                          background: formData.customerSuccess.includes(opt) ? 'var(--primary-100)' : '#f5f5f7',
                          color: formData.customerSuccess.includes(opt) ? 'var(--primary-900)' : '#333',
                          border: formData.customerSuccess.includes(opt) ? '1px solid var(--primary-600)' : '1px solid transparent',
                        }}
                      >
                        {opt}
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <label style={labelStyle}>Customer Support (Chọn nhiều)</label>
                  <div style={chipGridStyle}>
                    {dropdowns.customerSupport.map(opt => (
                      <div 
                        key={opt}
                        onClick={() => toggleChip('customerSupport', opt)}
                        style={{
                          ...chipStyle,
                          background: formData.customerSupport.includes(opt) ? 'var(--primary-100)' : '#f5f5f7',
                          color: formData.customerSupport.includes(opt) ? 'var(--primary-900)' : '#333',
                          border: formData.customerSupport.includes(opt) ? '1px solid var(--primary-600)' : '1px solid transparent',
                        }}
                      >
                        {opt}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </>
          )}

          {!isAlreadyCreated && (
            <button 
              type="submit" 
              disabled={loading}
              className="btn btn-primary"
              style={{ 
                marginTop: '24px',
                padding: '16px', 
                borderRadius: '12px', 
                fontSize: '17px', 
                fontWeight: 600,
                width: '100%',
                justifyContent: 'center',
                opacity: loading ? 0.7 : 1,
                cursor: loading ? 'not-allowed' : 'pointer'
              }}
            >
              {loading ? 'Đang xử lý...' : 'Tạo khách hàng & hợp đồng'}
            </button>
          )}
        </form>
      )}

      {/* Success Info Block at Bottom */}
      {successInfo && (
        <div ref={successRef} style={{ background: '#ecfdf5', border: '1px solid #10b981', borderRadius: '12px', padding: '32px', marginTop: '32px', boxShadow: '0 4px 12px rgba(16,185,129,0.1)' }}>
          <h2 style={{ fontSize: '20px', color: '#065f46', marginBottom: '16px', fontWeight: 700 }}>🎉 TẠO TÀI KHOẢN & HỢP ĐỒNG THÀNH CÔNG!</h2>
          <div style={{ background: '#fff', padding: '20px', borderRadius: '8px', fontFamily: 'monospace', fontSize: '15px', border: '1px solid #a7f3d0', lineHeight: '1.6', position: 'relative' }}>
            <p><strong style={{color: '#065f46'}}>Tên tài khoản:</strong> {successInfo.tenTaiKhoan}</p>
            <p style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <strong style={{color: '#065f46'}}>Mật khẩu:</strong> {showSuccessPwd ? successInfo.matKhau : '••••••••'}
              <button 
                type="button"
                onClick={() => setShowSuccessPwd(!showSuccessPwd)} 
                style={{ background: 'transparent', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: 0 }}
              >
                {showSuccessPwd ? <EyeOff size={16} color="var(--neutral-500)"/> : <Eye size={16} color="var(--neutral-500)"/>}
              </button>
            </p>
            <p><strong style={{color: '#065f46'}}>Org Id:</strong> {successInfo.orgId}</p>
            <p><strong style={{color: '#065f46'}}>Hình thức thanh toán:</strong> {successInfo.hinhThucThanhToan}</p>
            <p><strong style={{color: '#065f46'}}>Ngày bắt đầu:</strong> {successInfo.ngayBatDau}</p>
            <p><strong style={{color: '#065f46'}}>Ngày kết thúc:</strong> {successInfo.ngayKetThuc}</p>
            <p><strong style={{color: '#065f46'}}>Mã Khách hàng:</strong> {successInfo.customerId}</p>
            <p><strong style={{color: '#065f46'}}>Mã Hợp đồng:</strong> {successInfo.contractId}</p>
            
            <div style={{ marginTop: '16px', padding: '12px', background: '#fffbeb', borderLeft: '4px solid #f59e0b', color: '#b45309', borderRadius: '0 4px 4px 0', fontSize: '14px', fontWeight: 500 }}>
              ⚠️ Lưu ý: Hệ thống đã tự động tạo hợp đồng và <strong>{successInfo.createdServicesCount} dịch vụ ở trạng thái Pending</strong>. Vui lòng vào phần Quản lý hợp đồng & dịch vụ để bổ sung cấu hình và Active dịch vụ.
            </div>

            <button 
              type="button" 
              onClick={handleCopyAll}
              style={{ position: 'absolute', top: '20px', right: '20px', padding: '8px 16px', background: '#10b981', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 600, cursor: 'pointer' }}
            >
              📋 Copy Toàn Bộ
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

const labelStyle = {
  display: 'block', 
  fontSize: '13px', 
  marginBottom: '6px', 
  fontWeight: 600,
  color: '#555'
};

const inputStyle = {
  width: '100%',
  padding: '10px 14px',
  borderRadius: '8px',
  border: '1px solid #d2d2d7',
  fontSize: '14px',
  outline: 'none',
  backgroundColor: '#f5f5f7',
  color: '#1d1d1f'
};

const gridStyle = {
  display: 'grid', 
  gridTemplateColumns: '1fr 1fr 1fr', 
  gap: '16px'
};

const chipGridStyle = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
  gap: '8px',
};

const chipStyle = {
  padding: '10px 14px',
  borderRadius: '8px',
  fontSize: '13px',
  fontWeight: 500,
  cursor: 'pointer',
  textAlign: 'left' as const,
  transition: 'all 0.2s ease'
};