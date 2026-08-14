"use client";

import React, { useState, useEffect, useRef } from 'react';
import { createPendingRequest, getDropdownConfigs, checkEmailExists } from '@/lib/cx-actions';
import { DROPDOWNS as FALLBACK_DROPDOWNS } from '@/lib/constants';

export default function SaleForm() {
  const [loading, setLoading] = useState(false);
  const [successModalData, setSuccessModalData] = useState<string | null>(null);
  const [copyToast, setCopyToast] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const successRef = useRef<HTMLDivElement>(null);
  
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
    loaiYeuCau: 'Subscription',
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
    
    if (name === 'soDienThoai') {
      let numericValue = value.replace(/\D/g, '');
      if (numericValue.length > 0 && !numericValue.startsWith('84')) {
        if (numericValue.startsWith('0')) {
          numericValue = '84' + numericValue.substring(1);
        } else {
          numericValue = '84' + numericValue;
        }
      }
      if (numericValue.length > 11) numericValue = numericValue.substring(0, 11);
      setFormData(prev => ({ ...prev, [name]: numericValue }));
      return;
    }

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
    setFormData({ ...formData, loaiYeuCau: type });
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
        loaiYeuCau: formData.loaiYeuCau, 
        tenCongTy: '', khuVuc: '', loaiGoiCuoc: '', kenhGuiTin: [], 
        ngayBatDau: '', ngayKetThuc: '', moTaNhuCau: '', nganhNghe: '', agentId: '',
        hinhThucSD: '', hinhThucThanhToan: '', emailTaoTK: '', emailPhoiHop: '', 
        soDienThoai: '', tenSale: '', phanKhuc: '', soHopDong: '', cpid: '', duLieuInput: []
      });
      setTimeout(() => {
        successRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 100);
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
    <div className="animate-fade-in" style={{ display: 'flex', justifyContent: 'center', alignItems: 'flex-start', padding: 'var(--space-8) var(--space-4)', position: 'relative' }}>
      <div className="card-container" style={{ width: '100%', maxWidth: '800px', padding: '0', overflow: 'hidden' }}>
        
        <div style={{ padding: 'var(--space-8) var(--space-8) 0 var(--space-8)', textAlign: 'center' }}>
          <h1 style={{ fontSize: 'var(--text-2xl)', fontWeight: 800, marginBottom: 'var(--space-6)', color: 'var(--neutral-900)' }}>
            TẠO PHIẾU YÊU CẦU DỊCH VỤ
          </h1>
          
          <div style={{ marginBottom: 'var(--space-8)' }}>
            <p style={{ fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--neutral-600)', marginBottom: 'var(--space-3)' }}>
              Chọn Loại Khách Hàng <span className="text-error-600">*</span>
            </p>
            <div style={{ display: 'inline-flex', background: 'var(--neutral-100)', padding: '4px', borderRadius: 'var(--radius-lg)' }}>
              <button 
                type="button" 
                onClick={() => setCustomerType('Subscription')} 
                style={{ 
                  ...toggleBtnStyle, 
                  background: formData.loaiYeuCau === 'Subscription' ? '#fff' : 'transparent', 
                  color: formData.loaiYeuCau === 'Subscription' ? 'var(--primary-700)' : 'var(--neutral-600)', 
                  boxShadow: formData.loaiYeuCau === 'Subscription' ? 'var(--shadow-sm)' : 'none' 
                }}
              >
                Subscription (Phần mềm)
              </button>
              <button 
                type="button" 
                onClick={() => setCustomerType('Campaign')} 
                style={{ 
                  ...toggleBtnStyle, 
                  background: formData.loaiYeuCau === 'Campaign' ? '#fff' : 'transparent', 
                  color: formData.loaiYeuCau === 'Campaign' ? 'var(--primary-700)' : 'var(--neutral-600)', 
                  boxShadow: formData.loaiYeuCau === 'Campaign' ? 'var(--shadow-sm)' : 'none' 
                }}
              >
                Campaign
              </button>
            </div>
          </div>
        </div>

        <div style={{ padding: '0 var(--space-8) var(--space-8) var(--space-8)' }}>
          {submitError && (
            <div className="animate-fade-in-down" style={{ padding: '16px', background: 'var(--error-50)', color: 'var(--error-700)', borderLeft: '4px solid var(--error-500)', borderRadius: 'var(--radius-md)', marginBottom: '24px', fontWeight: 500 }}>
              {submitError}
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
            
            {/* Nhóm 1: Khách hàng & Thanh toán */}
            <fieldset style={fieldsetStyle}>
              <legend style={legendStyle}>1. Khách hàng & Thanh toán</legend>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={gridStyle}>
                  <div>
                    <label className="label-custom">Tên công ty <span className="text-error-600">*</span></label>
                    <input type="text" name="tenCongTy" value={formData.tenCongTy} onChange={handleChange} onBlur={handleBlur} required className="input-field w-full" style={{ background: '#fff' }} />
                  </div>
                  <div>
                    {formData.loaiYeuCau === 'Subscription' && (
                      <>
                        <label className="label-custom">Email tạo TK <span className="text-error-600">*</span></label>
                        <input type="email" name="emailTaoTK" value={formData.emailTaoTK} onChange={handleChange} onBlur={handleBlur} required className="input-field w-full" style={{ background: '#fff' }} />
                        {errors.emailTaoTK && <span style={errorTextStyle}>{errors.emailTaoTK}</span>}
                      </>
                    )}
                  </div>
                </div>

                <div style={gridStyle}>
                  <div>
                    <label className="label-custom">Số điện thoại <span className="text-error-600">*</span></label>
                    <input type="tel" name="soDienThoai" value={formData.soDienThoai} onChange={handleChange} onBlur={handleBlur} required className="input-field w-full" style={{ background: '#fff' }} />
                    {errors.soDienThoai && <span style={errorTextStyle}>{errors.soDienThoai}</span>}
                  </div>
                  <div>
                    <label className="label-custom">Khu vực <span className="text-error-600">*</span></label>
                    <select name="khuVuc" value={formData.khuVuc} onChange={handleChange} onBlur={handleBlur} required className="input-field w-full" style={{ background: '#fff' }}>
                      <option value="">-- Chọn --</option>
                      {dropdowns.khuVuc.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                    </select>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div>
                    <label className="label-custom">Ngành nghề</label>
                    <select name="nganhNghe" value={formData.nganhNghe} onChange={handleChange} onBlur={handleBlur} className="input-field w-full" style={{ background: '#fff' }}>
                      <option value="">-- Chọn --</option>
                      {dropdowns.nganhNghe.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="label-custom">Phân khúc</label>
                    <select name="phanKhuc" value={formData.phanKhuc} onChange={handleChange} onBlur={handleBlur} className="input-field w-full" style={{ background: '#fff' }}>
                      <option value="">-- Chọn --</option>
                      {dropdowns.phanKhuc.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                    </select>
                  </div>
                </div>

                <div style={gridStyle}>
                  <div>
                    <label className="label-custom">Hình thức thanh toán <span className="text-error-600">*</span></label>
                    <select name="hinhThucThanhToan" value={formData.hinhThucThanhToan} onChange={handleChange} onBlur={handleBlur} required className="input-field w-full" style={{ background: '#fff' }}>
                      <option value="">-- Chọn --</option>
                      {dropdowns.hinhThucThanhToan.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="label-custom">CPID</label>
                    <input type="text" name="cpid" value={formData.cpid} onChange={handleChange} onBlur={handleBlur} className="input-field w-full" style={{ background: '#fff' }} />
                  </div>
                </div>

                <div style={gridStyle}>
                  <div>
                    <label className="label-custom">Ngày bắt đầu <span className="text-error-600">*</span></label>
                    <input type="date" onClick={(e) => (e.target as any).showPicker && (e.target as any).showPicker()} name="ngayBatDau" value={formData.ngayBatDau} onChange={handleChange} onBlur={handleBlur} required className="input-field w-full" style={{ background: '#fff' }} />
                    {errors.ngayBatDau && <span style={errorTextStyle}>{errors.ngayBatDau}</span>}
                  </div>
                  <div>
                    <label className="label-custom">Ngày kết thúc <span className="text-error-600">*</span></label>
                    <input type="date" onClick={(e) => (e.target as any).showPicker && (e.target as any).showPicker()} name="ngayKetThuc" value={formData.ngayKetThuc} onChange={handleChange} onBlur={handleBlur} required className="input-field w-full" style={{ background: '#fff' }} />
                  </div>
                </div>
              </div>
            </fieldset>

            {/* Nhóm 2: Thông tin dịch vụ */}
            <fieldset style={fieldsetStyle}>
              <legend style={legendStyle}>2. Thông tin dịch vụ</legend>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                
                <div>
                  <label className="label-custom">Kênh gửi tin (Có thể chọn nhiều) <span className="text-error-600">*</span></label>
                  <div style={chipGridStyle}>
                    {dropdowns.kenhGuiTin.map(opt => (
                      <div 
                        key={opt}
                        onClick={() => toggleChip('kenhGuiTin', opt)}
                        style={{
                          ...chipStyle,
                          background: formData.kenhGuiTin.includes(opt) ? 'var(--primary-100)' : '#fff',
                          color: formData.kenhGuiTin.includes(opt) ? 'var(--primary-700)' : 'var(--neutral-700)',
                          border: formData.kenhGuiTin.includes(opt) ? '1px solid var(--primary-400)' : '1px solid var(--neutral-200)',
                        }}
                      >
                        {opt}
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="label-custom">Dữ liệu đầu vào (Input) (Có thể chọn nhiều)</label>
                  <div style={chipGridStyle}>
                    {dropdowns.duLieuInput.map(opt => (
                      <div 
                        key={opt}
                        onClick={() => toggleChip('duLieuInput', opt)}
                        style={{
                          ...chipStyle,
                          background: formData.duLieuInput.includes(opt) ? 'var(--primary-100)' : '#fff',
                          color: formData.duLieuInput.includes(opt) ? 'var(--primary-700)' : 'var(--neutral-700)',
                          border: formData.duLieuInput.includes(opt) ? '1px solid var(--primary-400)' : '1px solid var(--neutral-200)',
                        }}
                      >
                        {opt}
                      </div>
                    ))}
                  </div>
                </div>

                <div style={gridStyle}>
                  <div>
                    <label className="label-custom">Loại gói cước <span className="text-error-600">*</span></label>
                    <select name="loaiGoiCuoc" value={formData.loaiGoiCuoc} onChange={handleChange} onBlur={handleBlur} required className="input-field w-full" style={{ background: '#fff' }}>
                      <option value="">-- Chọn gói cước --</option>
                      {dropdowns.loaiGoiCuoc.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="label-custom">Hình thức sử dụng <span className="text-error-600">*</span></label>
                    <select name="hinhThucSD" value={formData.hinhThucSD} onChange={handleChange} onBlur={handleBlur} required className="input-field w-full" style={{ background: '#fff' }}>
                      <option value="">-- Chọn hình thức --</option>
                      {dropdowns.hinhThucSD.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="label-custom">Mô tả nhu cầu <span className="text-error-600">*</span></label>
                  <textarea name="moTaNhuCau" value={formData.moTaNhuCau} onChange={handleChange} onBlur={handleBlur} required className="input-field w-full" style={{ minHeight: '80px', resize: 'vertical', background: '#fff' }} />
                </div>
              </div>
            </fieldset>

            {/* Nhóm 3: Sale & Liên hệ */}
            <fieldset style={fieldsetStyle}>
              <legend style={legendStyle}>3. Sale & Liên hệ</legend>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '16px' }}>
                  <div>
                    <label className="label-custom">Tên Sale phụ trách <span className="text-error-600">*</span></label>
                    <select name="tenSale" value={formData.tenSale} onChange={handleChange} onBlur={handleBlur} required className="input-field w-full" style={{ background: '#fff' }}>
                      <option value="">-- Chọn Sale --</option>
                      {dropdowns.tenSale.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                    </select>
                  </div>
                </div>

                <div style={gridStyle}>
                  <div>
                    <label className="label-custom">Email phối hợp</label>
                    <input type="email" name="emailPhoiHop" value={formData.emailPhoiHop} onChange={handleChange} onBlur={handleBlur} className="input-field w-full" style={{ background: '#fff' }} />
                  </div>
                  <div>
                    <label className="label-custom">Agent ID (nếu có)</label>
                    <input type="text" name="agentId" value={formData.agentId} onChange={handleChange} onBlur={handleBlur} className="input-field w-full" style={{ background: '#fff' }} />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '16px' }}>
                  <div>
                    <label className="label-custom">Số hợp đồng (nếu có sẵn)</label>
                    <input type="text" name="soHopDong" value={formData.soHopDong} onChange={handleChange} onBlur={handleBlur} className="input-field w-full" style={{ background: '#fff' }} />
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
                fontSize: '16px', 
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
              <div ref={successRef} className="animate-fade-in-down" style={{ marginTop: '24px', padding: '32px', background: 'var(--success-50)', border: '1px solid var(--success-200)', borderRadius: 'var(--radius-lg)', textAlign: 'center' }}>
                <div style={{ fontSize: '40px', marginBottom: '16px' }}>🎉</div>
                <h3 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--success-700)', marginBottom: '8px' }}>Tạo phiếu thành công!</h3>
                <p style={{ color: 'var(--success-600)', fontSize: '15px', marginBottom: '24px' }}>Đã tạo thành công Hợp đồng, yêu cầu cập nhật thông tin hợp đồng và dịch vụ tương ứng.</p>
                <p style={{ color: 'var(--success-700)', marginBottom: '8px', fontWeight: 600 }}>Mã phiếu yêu cầu của bạn là:</p>
                <div style={{ fontSize: '28px', fontWeight: 800, color: 'var(--primary-700)', marginBottom: '24px', letterSpacing: '1px' }}>{successModalData}</div>
                
                <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', position: 'relative' }}>
                  <button type="button" onClick={handleCopy} className="btn btn-primary" style={{ padding: '12px 32px' }}>
                    Copy Mã Phiếu
                  </button>
                  {copyToast && (
                    <div className="animate-fade-in" style={{ position: 'absolute', bottom: '-40px', left: '50%', transform: 'translateX(-50%)', background: 'var(--neutral-800)', color: '#fff', padding: '6px 16px', borderRadius: '20px', fontSize: '13px', whiteSpace: 'nowrap' }}>
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
  borderRadius: 'var(--radius-md)',
  fontSize: '14px',
  fontWeight: 600,
  border: 'none',
  cursor: 'pointer',
  transition: 'var(--transition-fast)',
  minWidth: '140px'
};

const fieldsetStyle = {
  border: '1px solid var(--neutral-200)', 
  borderRadius: 'var(--radius-lg)', 
  padding: '24px', 
  background: 'var(--neutral-50)'
};

const legendStyle = {
  fontWeight: 600, 
  padding: '0 12px', 
  color: 'var(--primary-700)',
  fontSize: '15px'
};

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
  transition: 'var(--transition-fast)',
  boxShadow: 'var(--shadow-sm)'
};

const errorTextStyle = {
  color: 'var(--error-600)',
  fontSize: '12px',
  marginTop: '4px',
  display: 'block',
  fontWeight: 500
};