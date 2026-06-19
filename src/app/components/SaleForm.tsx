"use client";

import React, { useState, useEffect } from 'react';
import { createPendingRequest, getDropdownConfigs, checkEmailExists } from '@/lib/cx-actions';
import { DROPDOWNS as FALLBACK_DROPDOWNS } from '@/lib/constants';

export default function SaleForm() {
  const [loading, setLoading] = useState(false);
  const [successModalData, setSuccessModalData] = useState<string | null>(null);
  const [copyToast, setCopyToast] = useState(false);
  const [submitError, setSubmitError] = useState('');
  
  const [dropdowns, setDropdowns] = useState<Record<string, string[]>>(FALLBACK_DROPDOWNS);
  const [errors, setErrors] = useState<Record<string, string>>({});

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
    loaiKhachHang: 'Subscription',
    tenCongTy: '',
    khuVuc: '',
    loaiGoiCuoc: '',
    kenhGuiTin: [] as string[],
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
    duLieuInput: [] as string[]
  });

  const validateField = async (name: string, value: any, currentForm = formData) => {
    let err = '';
    
    if (name === 'soDienThoai' && value) {
      if (!/^84[0-9]{8,9}$/.test(value)) {
        err = 'SĐT phải bắt đầu bằng 84 và có 10-11 chữ số (VD: 84912345678)';
      }
    }
    
    if (name === 'emailTaoTK' && value) {
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
        err = 'Email không đúng định dạng';
      } else {
        const res = await checkEmailExists(value);
        if (res.success && res.exists) {
          err = 'Email này đã tồn tại trên hệ thống';
        }
      }
    }

    if (name === 'ngayBatDau' || name === 'ngayKetThuc') {
      const start = name === 'ngayBatDau' ? value : currentForm.ngayBatDau;
      const end = name === 'ngayKetThuc' ? value : currentForm.ngayKetThuc;
      if (start && end && new Date(start) >= new Date(end)) {
        setErrors(prev => ({ ...prev, ngayBatDau: 'Ngày bắt đầu phải nhỏ hơn ngày kết thúc', ngayKetThuc: '' }));
        return false;
      } else {
        setErrors(prev => ({ ...prev, ngayBatDau: '', ngayKetThuc: '' }));
      }
    }

    setErrors(prev => ({ ...prev, [name]: err }));
    return err === '';
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    validateField(e.target.name, e.target.value);
  };

  const toggleChip = (field: 'kenhGuiTin' | 'duLieuInput', option: string) => {
    setFormData(prev => {
      const arr = prev[field];
      if (arr.includes(option)) {
        return { ...prev, [field]: arr.filter(x => x !== option) };
      } else {
        return { ...prev, [field]: [...arr, option] };
      }
    });
  };

  const setCustomerType = (type: string) => {
    setFormData({ ...formData, loaiKhachHang: type });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setSubmitError('');

    // Final Validation Check
    const hasErrors = Object.values(errors).some(err => err !== '');
    if (hasErrors) {
      setSubmitError('Vui lòng sửa các lỗi nhập liệu trước khi gửi.');
      setLoading(false);
      return;
    }
    
    if (new Date(formData.ngayBatDau) >= new Date(formData.ngayKetThuc)) {
      setSubmitError('Ngày bắt đầu phải nhỏ hơn ngày kết thúc.');
      setLoading(false);
      return;
    }

    if (formData.kenhGuiTin.length === 0) {
      setSubmitError('Vui lòng chọn ít nhất 1 Kênh gửi tin.');
      setLoading(false);
      return;
    }

    const payload = {
      ...formData,
      kenhGuiTin: formData.kenhGuiTin.join(', '),
      duLieuInput: formData.duLieuInput.join(', ')
    };

    const res = await createPendingRequest(payload);
    if (res.success) {
      setSuccessModalData(res.requestId || null);
      setFormData({
        loaiKhachHang: formData.loaiKhachHang, 
        tenCongTy: '', khuVuc: '', loaiGoiCuoc: '', kenhGuiTin: [], 
        ngayBatDau: '', ngayKetThuc: '', moTaNhuCau: '', nganhNghe: '', agentId: '',
        hinhThucSD: '', hinhThucThanhToan: '', emailTaoTK: '', emailPhoiHop: '', 
        soDienThoai: '', tenSale: '', phanKhuc: '', soHopDong: '', cpid: '', duLieuInput: []
      });
    } else {
      setSubmitError(res.error || 'Có lỗi xảy ra');
    }
    setLoading(false);
  };

  const handleCopy = () => {
    if (successModalData) {
      navigator.clipboard.writeText(successModalData);
      setCopyToast(true);
      setTimeout(() => setCopyToast(false), 2000);
    }
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'flex-start', minHeight: '100vh', padding: '40px 20px', position: 'relative' }}>
      
      {/* Modal Thành công đã được di chuyển xuống dưới form */}
      <div style={{ width: '100%', maxWidth: '800px', background: '#fff', borderRadius: '16px', boxShadow: '0 8px 30px rgba(0,0,0,0.06)', overflow: 'hidden' }}>
        
        <div style={{ padding: '32px 32px 0 32px', textAlign: 'center' }}>
          <h1 style={{ fontSize: '26px', fontWeight: 700, marginBottom: '24px', color: '#1d1d1f', letterSpacing: '-0.5px' }}>TẠO PHIẾU YÊU CẦU DỊCH VỤ</h1>
          
          <div style={{ marginBottom: '32px' }}>
            <p style={{ fontSize: '15px', fontWeight: 600, color: '#555', marginBottom: '12px' }}>Chọn Loại Khách Hàng <span style={{color: 'red'}}>*</span></p>
            <div style={{ display: 'inline-flex', background: '#f5f5f7', padding: '4px', borderRadius: '12px' }}>
              <button type="button" onClick={() => setCustomerType('Subscription')} style={{ ...toggleBtnStyle, background: formData.loaiKhachHang === 'Subscription' ? '#fff' : 'transparent', color: formData.loaiKhachHang === 'Subscription' ? 'var(--primary-700)' : '#6e6e73', boxShadow: formData.loaiKhachHang === 'Subscription' ? '0 2px 8px rgba(0,0,0,0.1)' : 'none' }}>
                Subscription
              </button>
              <button type="button" onClick={() => setCustomerType('Campaign')} style={{ ...toggleBtnStyle, background: formData.loaiKhachHang === 'Campaign' ? '#fff' : 'transparent', color: formData.loaiKhachHang === 'Campaign' ? 'var(--primary-700)' : '#6e6e73', boxShadow: formData.loaiKhachHang === 'Campaign' ? '0 2px 8px rgba(0,0,0,0.1)' : 'none' }}>
                Campaign
              </button>
            </div>
          </div>
        </div>

        <div style={{ padding: '0 32px 32px 32px' }}>
          {submitError && <div style={{ padding: '14px', background: '#fee2e2', color: '#991b1b', borderRadius: '10px', marginBottom: '20px', fontWeight: 500 }}>{submitError}</div>}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
            
            {/* Nhóm 1: Khách hàng & Thanh toán */}
            <fieldset style={fieldsetStyle}>
              <legend style={legendStyle}>1. Khách hàng & Thanh toán</legend>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={gridStyle}>
                  <div>
                    <label style={labelStyle}>Tên công ty <span style={{ color: 'red' }}>*</span></label>
                    <input type="text" name="tenCongTy" value={formData.tenCongTy} onChange={handleChange} onBlur={handleBlur} required style={inputStyle} />
                  </div>
                  <div>
                    <label style={labelStyle}>Email tạo TK <span style={{ color: 'red' }}>*</span></label>
                    <input type="email" name="emailTaoTK" value={formData.emailTaoTK} onChange={handleChange} onBlur={handleBlur} required style={inputStyle} />
                    {errors.emailTaoTK && <span style={errorTextStyle}>{errors.emailTaoTK}</span>}
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
                  <div>
                    <label style={labelStyle}>Khu vực <span style={{ color: 'red' }}>*</span></label>
                    <select name="khuVuc" value={formData.khuVuc} onChange={handleChange} onBlur={handleBlur} required style={inputStyle}>
                      <option value="">-- Chọn --</option>
                      {dropdowns.khuVuc.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={labelStyle}>Ngành nghề</label>
                    <select name="nganhNghe" value={formData.nganhNghe} onChange={handleChange} onBlur={handleBlur} style={inputStyle}>
                      <option value="">-- Chọn --</option>
                      {dropdowns.nganhNghe.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={labelStyle}>Phân khúc</label>
                    <select name="phanKhuc" value={formData.phanKhuc} onChange={handleChange} onBlur={handleBlur} style={inputStyle}>
                      <option value="">-- Chọn --</option>
                      {dropdowns.phanKhuc.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                    </select>
                  </div>
                </div>

                <div style={gridStyle}>
                  <div>
                    <label style={labelStyle}>Hình thức thanh toán <span style={{ color: 'red' }}>*</span></label>
                    <select name="hinhThucThanhToan" value={formData.hinhThucThanhToan} onChange={handleChange} onBlur={handleBlur} required style={inputStyle}>
                      <option value="">-- Chọn --</option>
                      {dropdowns.hinhThucThanhToan.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={labelStyle}>CPID</label>
                    <input type="text" name="cpid" value={formData.cpid} onChange={handleChange} onBlur={handleBlur} style={inputStyle} />
                  </div>
                </div>

                <div style={gridStyle}>
                  <div>
                    <label style={labelStyle}>Ngày bắt đầu <span style={{ color: 'red' }}>*</span></label>
                    <input type="date" onClick={(e) => (e.target as any).showPicker && (e.target as any).showPicker()} name="ngayBatDau" value={formData.ngayBatDau} onChange={handleChange} onBlur={handleBlur} required style={inputStyle} />
                    {errors.ngayBatDau && <span style={errorTextStyle}>{errors.ngayBatDau}</span>}
                  </div>
                  <div>
                    <label style={labelStyle}>Ngày kết thúc <span style={{ color: 'red' }}>*</span></label>
                    <input type="date" onClick={(e) => (e.target as any).showPicker && (e.target as any).showPicker()} name="ngayKetThuc" value={formData.ngayKetThuc} onChange={handleChange} onBlur={handleBlur} required style={inputStyle} />
                  </div>
                </div>
              </div>
            </fieldset>

            {/* Nhóm 2: Thông tin dịch vụ */}
            <fieldset style={fieldsetStyle}>
              <legend style={legendStyle}>2. Thông tin dịch vụ</legend>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                
                <div>
                  <label style={labelStyle}>Kênh gửi tin (Có thể chọn nhiều) <span style={{ color: 'red' }}>*</span></label>
                  <div style={chipGridStyle}>
                    {dropdowns.kenhGuiTin.map(opt => (
                      <div 
                        key={opt}
                        onClick={() => toggleChip('kenhGuiTin', opt)}
                        style={{
                          ...chipStyle,
                          background: formData.kenhGuiTin.includes(opt) ? 'var(--primary-100)' : '#f5f5f7',
                          color: formData.kenhGuiTin.includes(opt) ? 'var(--primary-900)' : '#333',
                          border: formData.kenhGuiTin.includes(opt) ? '1px solid var(--primary-600)' : '1px solid transparent',
                        }}
                      >
                        {opt}
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <label style={labelStyle}>Dữ liệu đầu vào (Input) (Có thể chọn nhiều)</label>
                  <div style={chipGridStyle}>
                    {dropdowns.duLieuInput.map(opt => (
                      <div 
                        key={opt}
                        onClick={() => toggleChip('duLieuInput', opt)}
                        style={{
                          ...chipStyle,
                          background: formData.duLieuInput.includes(opt) ? 'var(--primary-100)' : '#f5f5f7',
                          color: formData.duLieuInput.includes(opt) ? 'var(--primary-900)' : '#333',
                          border: formData.duLieuInput.includes(opt) ? '1px solid var(--primary-600)' : '1px solid transparent',
                        }}
                      >
                        {opt}
                      </div>
                    ))}
                  </div>
                </div>

                <div style={gridStyle}>
                  <div>
                    <label style={labelStyle}>Loại gói cước <span style={{ color: 'red' }}>*</span></label>
                    <select name="loaiGoiCuoc" value={formData.loaiGoiCuoc} onChange={handleChange} onBlur={handleBlur} required style={inputStyle}>
                      <option value="">-- Chọn gói cước --</option>
                      {dropdowns.loaiGoiCuoc.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={labelStyle}>Hình thức sử dụng <span style={{ color: 'red' }}>*</span></label>
                    <select name="hinhThucSD" value={formData.hinhThucSD} onChange={handleChange} onBlur={handleBlur} required style={inputStyle}>
                      <option value="">-- Chọn hình thức --</option>
                      {dropdowns.hinhThucSD.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                    </select>
                  </div>
                </div>

                <div>
                  <label style={labelStyle}>Mô tả nhu cầu <span style={{ color: 'red' }}>*</span></label>
                  <textarea name="moTaNhuCau" value={formData.moTaNhuCau} onChange={handleChange} onBlur={handleBlur} required style={{ ...inputStyle, minHeight: '60px', resize: 'vertical' }} />
                </div>
              </div>
            </fieldset>

            {/* Nhóm 3: Sale & Liên hệ */}
            <fieldset style={fieldsetStyle}>
              <legend style={legendStyle}>3. Sale & Liên hệ</legend>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                
                <div style={gridStyle}>
                  <div>
                    <label style={labelStyle}>Tên Sale phụ trách <span style={{ color: 'red' }}>*</span></label>
                    <select name="tenSale" value={formData.tenSale} onChange={handleChange} onBlur={handleBlur} required style={inputStyle}>
                      <option value="">-- Chọn Sale --</option>
                      {dropdowns.tenSale.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={labelStyle}>Số điện thoại <span style={{ color: 'red' }}>*</span></label>
                    <input type="tel" name="soDienThoai" value={formData.soDienThoai} onChange={handleChange} onBlur={handleBlur} required style={inputStyle} />
                    {errors.soDienThoai && <span style={errorTextStyle}>{errors.soDienThoai}</span>}
                  </div>
                </div>

                <div style={gridStyle}>
                  <div>
                    <label style={labelStyle}>Email phối hợp</label>
                    <input type="email" name="emailPhoiHop" value={formData.emailPhoiHop} onChange={handleChange} onBlur={handleBlur} style={inputStyle} />
                  </div>
                  <div>
                    <label style={labelStyle}>Agent ID (nếu có)</label>
                    <input type="text" name="agentId" value={formData.agentId} onChange={handleChange} onBlur={handleBlur} style={inputStyle} />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '16px' }}>
                  <div>
                    <label style={labelStyle}>Số hợp đồng (nếu có sẵn)</label>
                    <input type="text" name="soHopDong" value={formData.soHopDong} onChange={handleChange} onBlur={handleBlur} style={inputStyle} />
                  </div>
                </div>

              </div>
            </fieldset>

            <button 
              type="submit" 
              disabled={loading}
              className="btn btn-primary"
              style={{ 
                marginTop: '16px',
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
              {loading ? 'Đang xử lý...' : 'GỬI PHIẾU YÊU CẦU'}
            </button>
            
            {successModalData && (
              <div style={{ marginTop: '24px', padding: '24px', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '12px', textAlign: 'center', animation: 'fadeIn 0.5s' }}>
                <div style={{ fontSize: '32px', marginBottom: '12px' }}>🎉</div>
                <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#166534', marginBottom: '8px' }}>Tạo phiếu thành công!</h3>
                <p style={{ color: '#15803d', fontSize: '14.5px', marginBottom: '16px' }}>Đã tạo thành công Hợp đồng, yêu cầu cập nhật thông tin hợp đồng và dịch vụ tương ứng.</p>
                <p style={{ color: '#166534', marginBottom: '8px', fontWeight: 600 }}>Mã phiếu yêu cầu của bạn là:</p>
                <div style={{ fontSize: '24px', fontWeight: 700, color: 'var(--primary-700)', marginBottom: '20px', letterSpacing: '1px' }}>{successModalData}</div>
                
                <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', position: 'relative' }}>
                  <button type="button" onClick={handleCopy} style={{ padding: '10px 24px', background: 'var(--primary-700)', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    Copy Mã Phiếu
                  </button>
                  {copyToast && (
                    <div style={{ position: 'absolute', bottom: '-40px', left: '50%', transform: 'translateX(-50%)', background: '#333', color: '#fff', padding: '6px 12px', borderRadius: '20px', fontSize: '12px', whiteSpace: 'nowrap', animation: 'fadeIn 0.2s' }}>
                      Đã copy!
                    </div>
                  )}
                </div>
              </div>
            )}
            
          </form>
        </div>
      </div>
    </div>
  );
}

// Reusable Styles
const toggleBtnStyle = {
  padding: '10px 24px',
  borderRadius: '10px',
  fontSize: '15px',
  fontWeight: 600,
  border: 'none',
  cursor: 'pointer',
  transition: 'all 0.2s ease',
  minWidth: '140px'
};

const fieldsetStyle = {
  border: '1px solid #e5e5ea', 
  borderRadius: '12px', 
  padding: '24px', 
  background: '#fafafa'
};

const legendStyle = {
  fontWeight: 600, 
  padding: '0 12px', 
  color: '#1d1d1f',
  fontSize: '16px'
};

const labelStyle = {
  display: 'block', 
  fontSize: '14px', 
  marginBottom: '8px', 
  fontWeight: 500,
  color: '#1d1d1f'
};

const gridStyle = {
  display: 'grid', 
  gridTemplateColumns: '1fr 1fr', 
  gap: '16px'
};

const inputStyle = {
  width: '100%',
  padding: '12px 14px',
  borderRadius: '10px',
  border: '1px solid #d2d2d7',
  fontSize: '15px',
  outline: 'none',
  transition: 'border-color 0.2s, box-shadow 0.2s',
  backgroundColor: '#fff',
  color: '#1d1d1f'
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

const errorTextStyle = {
  color: '#dc2626',
  fontSize: '12px',
  marginTop: '4px',
  display: 'block',
  fontWeight: 500
};