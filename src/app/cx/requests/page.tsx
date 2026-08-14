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
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div className="page-header">
        <h1 style={{ fontSize: 'var(--text-2xl)', fontWeight: 800, color: 'var(--neutral-900)', margin: '0 0 4px 0' }}>
          Tạo tài khoản từ Phiếu yêu cầu
        </h1>
      </div>
      
      {/* Search Bar */}
      <div className="card-container" style={{ padding: 'var(--space-6)', marginBottom: 'var(--space-6)', display: 'flex', flexWrap: 'wrap', gap: '16px', alignItems: 'flex-end', zIndex: 10, position: 'relative', overflow: 'visible' }}>
        <form onSubmit={handleSearch} style={{ display: 'flex', gap: '16px', width: '100%', maxWidth: '800px' }}>
          <div style={{ flex: 1 }}>
            <label className="label-custom" style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '8px' }}>Mã phiếu yêu cầu</label>
            <div style={{ position: 'relative' }}>
              <Search size={16} style={{ position: 'absolute', left: '12px', top: '13px', color: 'var(--neutral-400)', zIndex: 5 }} />
              <input 
                type="text" 
                placeholder="Nhập mã phiếu yêu cầu (VD: REQ-171842000)" 
                value={searchId}
                onChange={(e) => setSearchId(e.target.value)}
                className="input-field w-full"
                style={{ paddingLeft: '36px', height: '42px' }}
              />
            </div>
          </div>
          <button type="submit" disabled={loading} className="btn btn-primary" style={{ padding: '0 24px', height: '42px' }}>
            Tìm kiếm
          </button>
        </form>
      </div>

      {error && <div ref={errorRef} style={{ padding: '16px', background: 'var(--error-50)', color: 'var(--error-700)', borderRadius: '8px', marginBottom: '24px', borderLeft: '4px solid var(--error-500)' }}>{error}</div>}

      {/* Warning if already created */}
      {isAlreadyCreated && requestData && !successInfo && (
        <div style={{ padding: '16px', background: 'var(--warning-50)', color: 'var(--warning-700)', borderLeft: '4px solid var(--warning-500)', borderRadius: '8px', marginBottom: '24px', fontWeight: 500 }}>
          ⚠️ CẢNH BÁO: Phiếu yêu cầu này đã được tạo tài khoản (Mã KH: {requestData.result_customer_id}). Bạn không thể tạo lại.
        </div>
      )}

      {/* Review Form */}
      {requestData && (
        <form onSubmit={handleCreateAccount} className="card-container animate-fade-in-down" style={{ display: 'flex', flexDirection: 'column', gap: '32px', opacity: isAlreadyCreated && !successInfo ? 0.6 : 1, pointerEvents: isAlreadyCreated && !successInfo ? 'none' : 'auto' }}>
          
          {/* PHẦN 1: REVIEW THÔNG TIN SALE */}
          <div>
            <h2 style={{ fontSize: '18px', fontWeight: 600, borderBottom: '1px solid var(--neutral-200)', paddingBottom: '12px', marginBottom: '20px', color: 'var(--primary-700)' }}>
              Phần 1: Thông tin từ Phiếu yêu cầu <span style={{ fontSize: '13px', fontWeight: 400, color: 'var(--neutral-500)' }}>(Có thể chỉnh sửa)</span>
            </h2>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div style={gridStyle}>
                <div>
                  <label className="label-custom">Tên công ty</label>
                  <input type="text" name="tenCongTy" value={formData.tenCongTy} onChange={handleChange} className="input-field w-full" />
                </div>
                <div>
                  <label className="label-custom">Email tạo TK</label>
                  <input type="text" name="emailTaoTK" value={formData.emailTaoTK} onChange={handleChange} className="input-field w-full" />
                </div>
                <div>
                  <label className="label-custom">Số điện thoại</label>
                  <input type="text" name="soDienThoai" value={formData.soDienThoai} onChange={handleChange} className="input-field w-full" />
                </div>
              </div>

              <div style={gridStyle}>
                <div>
                  <label className="label-custom">Ngày bắt đầu</label>
                  <input type="date" onClick={(e) => (e.target as any).showPicker && (e.target as any).showPicker()} name="ngayBatDau" value={formData.ngayBatDau} onChange={handleChange} className="input-field w-full" />
                </div>
                <div>
                  <label className="label-custom">Ngày kết thúc</label>
                  <input type="date" onClick={(e) => (e.target as any).showPicker && (e.target as any).showPicker()} name="ngayKetThuc" value={formData.ngayKetThuc} onChange={handleChange} className="input-field w-full" />
                </div>
              </div>

              <div style={gridStyle}>
                <div>
                  <label className="label-custom">Loại yêu cầu</label>
                  <select name="loaiYeuCau" value={formData.loaiYeuCau} onChange={handleChange} className="input-field w-full">
                    <option value="Subscription">Subscription</option>
                    <option value="Campaign">Campaign</option>
                  </select>
                </div>
                <div>
                  <label className="label-custom">Hình thức thanh toán</label>
                  <select name="hinhThucThanhToan" value={formData.hinhThucThanhToan} onChange={handleChange} className="input-field w-full">
                    <option value="">-- Chọn --</option>
                    {dropdowns.hinhThucThanhToan.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                  </select>
                </div>
              </div>

              <div style={gridStyle}>
                <div>
                  <label className="label-custom">Kênh gửi tin (Sale nhập)</label>
                  <input type="text" name="kenhGuiTin" value={formData.kenhGuiTin} onChange={handleChange} className="input-field w-full" />
                </div>
                <div>
                  <label className="label-custom">Dữ liệu đầu vào (Sale nhập)</label>
                  <input type="text" name="duLieuInput" value={formData.duLieuInput} onChange={handleChange} className="input-field w-full" />
                </div>
              </div>
              
              <div>
                <label className="label-custom">Mô tả nhu cầu (Sale ghi)</label>
                <textarea name="moTaNhuCau" value={formData.moTaNhuCau} onChange={handleChange} className="input-field w-full" style={{ minHeight: '80px', resize: 'vertical' }} />
              </div>
            </div>
          </div>

          {/* PHẦN 2: BỔ SUNG THÔNG TIN CS (Chỉ hiển thị cho phần mềm Subscription) */}
          {formData.loaiYeuCau === 'Subscription' && (
            <div style={{ background: 'var(--neutral-50)', padding: '24px', borderRadius: 'var(--radius-lg)', border: '1px solid var(--neutral-200)' }}>
              <h2 style={{ fontSize: '18px', fontWeight: 600, borderBottom: '1px solid var(--neutral-200)', paddingBottom: '12px', marginBottom: '20px', color: 'var(--primary-700)' }}>Phần 2: Bổ sung thông tin CS (Bắt buộc cho Subscription)</h2>
              <div style={gridStyle}>
                <div>
                  <label className="label-custom">Tên tài khoản <span className="text-error-600">*</span></label>
                  <input type="text" name="tenTaiKhoan" value={formData.tenTaiKhoan} onChange={handleChange} required className="input-field w-full" style={{ background: '#fff' }} />
                </div>
                <div>
                  <label className="label-custom">Mật khẩu <span className="text-error-600">*</span></label>
                  <input type="text" name="matKhau" value={formData.matKhau} onChange={handleChange} required className="input-field w-full" style={{ background: '#fff' }} />
                </div>
                <div>
                  <label className="label-custom">Org ID <span className="text-error-600">*</span></label>
                  <input type="text" name="orgId" value={formData.orgId} onChange={handleChange} required className="input-field w-full" style={{ background: '#fff' }} />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginTop: '20px' }}>
                <div>
                  <label className="label-custom">Customer Success (Chọn nhiều)</label>
                  <div style={chipGridStyle}>
                    {dropdowns.customerSuccess.map(opt => (
                      <div 
                        key={opt}
                        onClick={() => toggleChip('customerSuccess', opt)}
                        style={{
                          ...chipStyle,
                          background: formData.customerSuccess.includes(opt) ? 'var(--primary-100)' : '#fff',
                          color: formData.customerSuccess.includes(opt) ? 'var(--primary-700)' : 'var(--neutral-700)',
                          border: formData.customerSuccess.includes(opt) ? '1px solid var(--primary-400)' : '1px solid var(--neutral-200)',
                        }}
                      >
                        {opt}
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="label-custom">Customer Support (Chọn nhiều)</label>
                  <div style={chipGridStyle}>
                    {dropdowns.customerSupport.map(opt => (
                      <div 
                        key={opt}
                        onClick={() => toggleChip('customerSupport', opt)}
                        style={{
                          ...chipStyle,
                          background: formData.customerSupport.includes(opt) ? 'var(--primary-100)' : '#fff',
                          color: formData.customerSupport.includes(opt) ? 'var(--primary-700)' : 'var(--neutral-700)',
                          border: formData.customerSupport.includes(opt) ? '1px solid var(--primary-400)' : '1px solid var(--neutral-200)',
                        }}
                      >
                        {opt}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {!isAlreadyCreated && (
            <div style={{ borderTop: '1px solid var(--neutral-200)', paddingTop: '24px', display: 'flex', justifyContent: 'flex-end' }}>
              <button 
                type="submit" 
                disabled={loading}
                className="btn btn-primary"
                style={{ 
                  padding: '14px 32px', 
                  fontSize: '16px', 
                  opacity: loading ? 0.7 : 1,
                  cursor: loading ? 'not-allowed' : 'pointer'
                }}
              >
                {loading ? 'Đang xử lý...' : 'Tạo khách hàng & hợp đồng'}
              </button>
            </div>
          )}
        </form>
      )}

      {/* Success Info Block at Bottom */}
      {successInfo && (
        <div ref={successRef} className="animate-fade-in-down" style={{ background: 'var(--success-50)', border: '1px solid var(--success-200)', borderRadius: 'var(--radius-lg)', padding: '32px', marginTop: '16px' }}>
          <h2 style={{ fontSize: '20px', color: 'var(--success-700)', marginBottom: '16px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <CheckCircle size={24} /> TẠO TÀI KHOẢN & HỢP ĐỒNG THÀNH CÔNG!
          </h2>
          <div style={{ background: '#fff', padding: '24px', borderRadius: 'var(--radius-md)', fontFamily: 'monospace', fontSize: '14px', border: '1px solid var(--success-100)', lineHeight: '1.8', position: 'relative' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div><strong style={{color: 'var(--success-700)'}}>Tên tài khoản:</strong> {successInfo.tenTaiKhoan}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <strong style={{color: 'var(--success-700)'}}>Mật khẩu:</strong> {showSuccessPwd ? successInfo.matKhau : '••••••••'}
                <button 
                  type="button"
                  onClick={() => setShowSuccessPwd(!showSuccessPwd)} 
                  style={{ background: 'transparent', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: '4px' }}
                >
                  {showSuccessPwd ? <EyeOff size={16} color="var(--neutral-500)"/> : <Eye size={16} color="var(--neutral-500)"/>}
                </button>
              </div>
              <div><strong style={{color: 'var(--success-700)'}}>Org Id:</strong> {successInfo.orgId}</div>
              <div><strong style={{color: 'var(--success-700)'}}>Hình thức thanh toán:</strong> {successInfo.hinhThucThanhToan}</div>
              <div><strong style={{color: 'var(--success-700)'}}>Ngày bắt đầu:</strong> {successInfo.ngayBatDau}</div>
              <div><strong style={{color: 'var(--success-700)'}}>Ngày kết thúc:</strong> {successInfo.ngayKetThuc}</div>
              <div><strong style={{color: 'var(--success-700)'}}>Mã Khách hàng:</strong> {successInfo.customerId}</div>
              <div><strong style={{color: 'var(--success-700)'}}>Mã Hợp đồng:</strong> {successInfo.contractId}</div>
            </div>
            
            <div style={{ marginTop: '24px', padding: '16px', background: 'var(--warning-50)', borderLeft: '4px solid var(--warning-500)', color: 'var(--warning-700)', borderRadius: '0 4px 4px 0', fontSize: '14px', fontWeight: 500 }}>
              ⚠️ Lưu ý: Hệ thống đã tự động tạo hợp đồng và <strong>{successInfo.createdServicesCount} dịch vụ ở trạng thái Pending</strong>. Vui lòng vào phần Quản lý hợp đồng & dịch vụ để bổ sung cấu hình và Active dịch vụ.
            </div>

            <button 
              type="button" 
              onClick={handleCopyAll}
              className="btn btn-secondary"
              style={{ position: 'absolute', top: '24px', right: '24px', padding: '6px 16px', background: 'var(--success-100)', color: 'var(--success-700)', border: 'none' }}
            >
              📋 Copy Toàn Bộ
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

const gridStyle = {
  display: 'grid', 
  gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', 
  gap: '16px'
};

const chipGridStyle = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
  gap: '8px',
};

const chipStyle = {
  padding: '8px 12px',
  borderRadius: '6px',
  fontSize: '13px',
  fontWeight: 500,
  cursor: 'pointer',
  textAlign: 'center' as const,
  transition: 'all 0.2s ease',
  boxShadow: 'var(--shadow-sm)'
};