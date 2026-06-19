'use client';

import React, { useEffect, useState } from 'react';
import { X, Eye, EyeOff } from 'lucide-react';
import { getCustomer360 } from '@/lib/cx-actions';

interface ModalProps {
  customerId: string | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function Customer360Drawer({ customerId, isOpen, onClose }: ModalProps) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && customerId) {
      fetchData();
    } else {
      setData(null);
    }
  }, [isOpen, customerId]);

  const fetchData = async () => {
    setLoading(true);
    const res = await getCustomer360(customerId!);
    if (res.success) {
      setData(res.data);
    }
    setLoading(false);
  };

  if (!isOpen) return null;

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 3000, display: 'flex', justifyContent: 'center', alignItems: 'center', background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', padding: '24px' }}>
      <div className="animate-fade-in-up" style={{ width: '100%', maxWidth: '1200px', background: '#F8FAFC', height: '100%', maxHeight: '90vh', display: 'flex', flexDirection: 'column', borderRadius: '16px', boxShadow: '0 24px 48px rgba(0,0,0,0.2)', overflow: 'hidden' }}>
        
        {/* Header Fixed */}
        <div style={{ padding: '24px 32px', borderBottom: '1px solid var(--neutral-200)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#fff', flexShrink: 0 }}>
          <div>
            <h2 style={{ margin: 0, fontSize: '24px', fontWeight: 700, color: 'var(--neutral-900)' }}>
              {data?.customer?.ten_cong_ty || (loading ? 'Đang tải thông tin...' : 'Không tìm thấy KH')}
            </h2>
            <div style={{ display: 'flex', gap: '12px', marginTop: '8px', alignItems: 'center' }}>
              <span style={{ color: 'var(--neutral-600)', fontSize: '14px', fontWeight: 500 }}>Mã KH: <span style={{ color: 'var(--primary-700)' }}>{customerId}</span></span>
              {data?.customer?.loai_khach_hang && (
                <span className="badge-custom" style={{ background: 'var(--neutral-100)', color: 'var(--neutral-700)', padding: '2px 8px', fontSize: '12px' }}>
                  {data.customer.loai_khach_hang}
                </span>
              )}
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'var(--neutral-100)', border: 'none', padding: '10px', borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background 0.2s' }} onMouseOver={e => e.currentTarget.style.background = 'var(--neutral-200)'} onMouseOut={e => e.currentTarget.style.background = 'var(--neutral-100)'}>
            <X size={20} color="var(--neutral-700)" />
          </button>
        </div>

        {/* Content Scrollable */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '32px', display: 'flex', flexDirection: 'column', gap: '32px' }}>
          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', color: 'var(--neutral-500)', fontSize: '15px' }}>
              <div style={{ width: '24px', height: '24px', border: '3px solid var(--neutral-200)', borderTopColor: 'var(--primary-600)', borderRadius: '50%', animation: 'spin 1s linear infinite', marginRight: '12px' }} />
              Đang tải dữ liệu khách hàng 360...
            </div>
          ) : !data ? (
            <div style={{ textAlign: 'center', padding: '40px', color: 'var(--error-600)' }}>Không tìm thấy thông tin khách hàng.</div>
          ) : (
            <>
              <SectionInfo customer={data.customer} />
              <SectionServices contracts={data.contracts} services={data.services} />
              <SectionHistory requests={data.requests} />
            </>
          )}
        </div>
      </div>
      
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes fadeInUp {
          from { transform: translateY(20px) scale(0.98); opacity: 0; }
          to { transform: translateY(0) scale(1); opacity: 1; }
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        .animate-fade-in-up { animation: fadeInUp 0.3s cubic-bezier(0.16, 1, 0.3, 1); }
      `}} />
    </div>
  );
}

function SectionInfo({ customer }: { customer: any }) {
  const [showPassword, setShowPassword] = useState(false);
  if (!customer) return <div style={{ color: 'var(--neutral-500)' }}>Chưa có thông tin.</div>;
  const formatDate = (ds: string) => ds ? new Date(ds).toLocaleDateString('vi-VN') : '--';
  return (
    <div style={{ background: '#fff', padding: '28px', borderRadius: 'var(--radius-lg)', border: '1px solid var(--neutral-200)', boxShadow: 'var(--shadow-sm)' }}>
      <h3 style={{ fontSize: '18px', fontWeight: 700, margin: '0 0 24px 0', color: 'var(--neutral-900)' }}>Thông tin chung</h3>
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
        <div><label style={{ fontSize: '13px', color: 'var(--neutral-500)', display: 'block', marginBottom: '6px' }}>Mã khách hàng</label><div style={{ fontWeight: 600, color: 'var(--neutral-900)' }}>{customer.customer_id || '--'}</div></div>
        <div style={{ gridColumn: 'span 2' }}><label style={{ fontSize: '13px', color: 'var(--neutral-500)', display: 'block', marginBottom: '6px' }}>Tên công ty</label><div style={{ fontWeight: 600, color: 'var(--neutral-900)' }}>{customer.ten_cong_ty || '--'}</div></div>
        <div><label style={{ fontSize: '13px', color: 'var(--neutral-500)', display: 'block', marginBottom: '6px' }}>Mã số thuế</label><div style={{ fontWeight: 500, color: 'var(--neutral-800)' }}>{customer.ma_so_thue || '--'}</div></div>
        
        <div><label style={{ fontSize: '13px', color: 'var(--neutral-500)', display: 'block', marginBottom: '6px' }}>Khu vực</label><div style={{ fontWeight: 500, color: 'var(--neutral-800)' }}>{customer.khu_vuc || '--'}</div></div>
        <div><label style={{ fontSize: '13px', color: 'var(--neutral-500)', display: 'block', marginBottom: '6px' }}>Quốc gia</label><div style={{ fontWeight: 500, color: 'var(--neutral-800)' }}>{customer.quoc_gia || '--'}</div></div>
        <div><label style={{ fontSize: '13px', color: 'var(--neutral-500)', display: 'block', marginBottom: '6px' }}>Phân khúc</label><div style={{ fontWeight: 500, color: 'var(--neutral-800)' }}>{customer.phan_khuc || '--'}</div></div>
        <div><label style={{ fontSize: '13px', color: 'var(--neutral-500)', display: 'block', marginBottom: '6px' }}>Ngày bắt đầu SD</label><div style={{ fontWeight: 500, color: 'var(--neutral-800)' }}>{formatDate(customer.ngay_bat_dau_sd)}</div></div>
      </div>

      <div style={{ gridColumn: '1 / -1', height: '1px', background: 'var(--neutral-100)', margin: '20px 0' }} />

      <h4 style={{ fontSize: '15px', fontWeight: 600, margin: '0 0 16px 0', color: 'var(--neutral-800)' }}>Dữ liệu Hệ thống & Nguồn</h4>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
        <div><label style={{ fontSize: '13px', color: 'var(--neutral-500)', display: 'block', marginBottom: '6px' }}>Org ID</label><div style={{ fontWeight: 600, color: 'var(--neutral-900)' }}>{customer.org_id || '--'}</div></div>
        <div><label style={{ fontSize: '13px', color: 'var(--neutral-500)', display: 'block', marginBottom: '6px' }}>CPID</label><div style={{ fontWeight: 600, color: 'var(--neutral-900)' }}>{customer.cpid || '--'}</div></div>
        <div><label style={{ fontSize: '13px', color: 'var(--neutral-500)', display: 'block', marginBottom: '6px' }}>CP Name</label><div style={{ fontWeight: 600, color: 'var(--neutral-900)' }}>{customer.cp_name || '--'}</div></div>
        <div><label style={{ fontSize: '13px', color: 'var(--neutral-500)', display: 'block', marginBottom: '6px' }}>Tài khoản</label><div style={{ fontWeight: 600, color: 'var(--primary-700)' }}>{customer.ten_tai_khoan || '--'}</div></div>
        <div>
          <label style={{ fontSize: '13px', color: 'var(--neutral-500)', display: 'block', marginBottom: '6px' }}>Mật khẩu</label>
          <div style={{ fontWeight: 600, color: 'var(--neutral-900)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            {showPassword ? (customer.mat_khau || '--') : (customer.mat_khau ? '••••••' : '--')}
            {customer.mat_khau && (
              <button 
                onClick={() => setShowPassword(!showPassword)} 
                title={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                style={{ background: 'none', border: 'none', padding: '4px', cursor: 'pointer', display: 'flex', color: 'var(--neutral-500)', borderRadius: '4px' }}
                onMouseOver={e => e.currentTarget.style.background = 'var(--neutral-100)'} 
                onMouseOut={e => e.currentTarget.style.background = 'transparent'}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            )}
          </div>
        </div>
        <div><label style={{ fontSize: '13px', color: 'var(--neutral-500)', display: 'block', marginBottom: '6px' }}>Email tạo TK</label><div style={{ fontWeight: 500, color: 'var(--neutral-800)' }}>{customer.email_tao_tk || '--'}</div></div>
        <div><label style={{ fontSize: '13px', color: 'var(--neutral-500)', display: 'block', marginBottom: '6px' }}>Kênh gửi tin</label><div style={{ fontWeight: 500, color: 'var(--neutral-800)' }}>{customer.kenh_gui_tin || '--'}</div></div>
        <div><label style={{ fontSize: '13px', color: 'var(--neutral-500)', display: 'block', marginBottom: '6px' }}>Dữ liệu Input</label><div style={{ fontWeight: 500, color: 'var(--neutral-800)' }}>{customer.du_lieu_input || '--'}</div></div>
      </div>

      <div style={{ gridColumn: '1 / -1', height: '1px', background: 'var(--neutral-100)', margin: '20px 0' }} />

      <h4 style={{ fontSize: '15px', fontWeight: 600, margin: '0 0 16px 0', color: 'var(--neutral-800)' }}>Liên hệ & Phụ trách</h4>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
        <div><label style={{ fontSize: '13px', color: 'var(--neutral-500)', display: 'block', marginBottom: '6px' }}>Số điện thoại</label><div style={{ fontWeight: 500, color: 'var(--neutral-800)' }}>{customer.so_dien_thoai || '--'}</div></div>
        <div><label style={{ fontSize: '13px', color: 'var(--neutral-500)', display: 'block', marginBottom: '6px' }}>Contact phối hợp</label><div style={{ fontWeight: 500, color: 'var(--neutral-800)' }}>{customer.contact_phoi_hop || '--'}</div></div>
        <div><label style={{ fontSize: '13px', color: 'var(--neutral-500)', display: 'block', marginBottom: '6px' }}>Sale phụ trách</label><div style={{ fontWeight: 600, color: 'var(--gold-600)' }}>{customer.sale_phu_trach || customer.sale_in_charge || '--'}</div></div>
        <div><label style={{ fontSize: '13px', color: 'var(--neutral-500)', display: 'block', marginBottom: '6px' }}>Customer Success</label><div style={{ fontWeight: 600, color: 'var(--primary-600)' }}>{customer.customer_success || customer.cs_in_charge || '--'}</div></div>
        <div style={{ gridColumn: 'span 2' }}><label style={{ fontSize: '13px', color: 'var(--neutral-500)', display: 'block', marginBottom: '6px' }}>Mô tả nhu cầu từ Sale</label><div style={{ fontWeight: 500, color: 'var(--neutral-800)' }}>{customer.mo_ta_nhu_cau_tu_sale || '--'}</div></div>
      </div>
    </div>
  );
}

function SectionServices({ contracts, services }: { contracts: any[], services: any[] }) {
  const formatDate = (ds: string) => ds ? new Date(ds).toLocaleDateString('vi-VN') : '--';
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '32px' }}>
      <div style={{ background: '#fff', padding: '24px', borderRadius: 'var(--radius-lg)', border: '1px solid var(--neutral-200)', boxShadow: 'var(--shadow-sm)' }}>
        <h3 style={{ fontSize: '18px', fontWeight: 700, margin: '0 0 20px 0', color: 'var(--neutral-900)' }}>Dịch vụ đang sử dụng ({services.length})</h3>
        <div style={{ overflowX: 'auto', border: '1px solid var(--neutral-200)', borderRadius: 'var(--radius-md)' }}>
          <table className="custom-table" style={{ fontSize: '13px', minWidth: '800px', margin: 0 }}>
            <thead><tr><th>Mã DV</th><th>Loại DV</th><th>Brand/OA</th><th>CP Name</th><th>Bắt đầu</th><th>Hết hạn</th><th>Trạng thái</th><th>SUP</th><th style={{ textAlign: 'center' }}>Thao tác</th></tr></thead>
            <tbody>
              {services.map(s => (
                <tr key={s.service_id}>
                  <td style={{ fontWeight: 600, color: 'var(--primary-700)' }}>{s.service_id}</td>
                  <td>{s.loai_dich_vu}</td>
                  <td>{s.brand_name_oa || '--'}</td>
                  <td>{s.cp_name_code || '--'}</td>
                  <td>{formatDate(s.ngay_bat_dau)}</td>
                  <td>{formatDate(s.ngay_het_han)}</td>
                  <td><span className="badge-custom" style={{ background: s.trang_thai === 'Active' ? 'var(--primary-50)' : 'var(--neutral-100)', color: s.trang_thai === 'Active' ? 'var(--primary-700)' : 'var(--neutral-600)', border: s.trang_thai === 'Active' ? '1px solid var(--primary-200)' : '1px solid var(--neutral-300)' }}>{s.trang_thai}</span></td>
                  <td style={{ fontWeight: 600, color: 'var(--gold-700)' }}>{s.sup_phu_trach || '--'}</td>
                  <td style={{ textAlign: 'center' }}>
                    <a href={`/cx/services?edit=${s.service_id}`} target="_blank" rel="noopener noreferrer" className="btn btn-primary" style={{ textDecoration: 'none', padding: '4px 12px', fontSize: '13px' }}>
                      Chỉnh sửa
                    </a>
                  </td>
                </tr>
              ))}
              {services.length === 0 && <tr><td colSpan={9} style={{ textAlign: 'center', color: 'var(--neutral-500)', padding: '24px' }}>Khách hàng chưa sử dụng dịch vụ nào.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
      
      <div style={{ background: '#fff', padding: '24px', borderRadius: 'var(--radius-lg)', border: '1px solid var(--neutral-200)', boxShadow: 'var(--shadow-sm)' }}>
        <h3 style={{ fontSize: '18px', fontWeight: 700, margin: '0 0 20px 0', color: 'var(--neutral-900)' }}>Danh sách Hợp đồng ({contracts.length})</h3>
        <div style={{ overflowX: 'auto', border: '1px solid var(--neutral-200)', borderRadius: 'var(--radius-md)' }}>
          <table className="custom-table" style={{ fontSize: '13px', margin: 0 }}>
            <thead><tr><th>Mã Hợp đồng</th><th>Số HĐ / PO</th><th>Bắt đầu</th><th>Kết thúc</th><th>Trạng thái</th><th style={{ textAlign: 'center' }}>Thao tác</th></tr></thead>
            <tbody>
              {contracts.map(c => (
                <tr key={c.contract_id}>
                  <td style={{ fontWeight: 600, color: 'var(--primary-700)' }}>{c.contract_id}</td>
                  <td style={{ fontWeight: 500, color: 'var(--neutral-800)' }}>{c.so_hop_dong || '--'}</td>
                  <td>{formatDate(c.ngay_bat_dau_hd)}</td>
                  <td>{formatDate(c.ngay_ket_thuc_hd)}</td>
                  <td>{c.trang_thai}</td>
                  <td style={{ textAlign: 'center' }}>
                    <a href={`/cx/contracts?edit=${c.contract_id}`} target="_blank" rel="noopener noreferrer" className="btn btn-primary" style={{ textDecoration: 'none', padding: '4px 12px', fontSize: '13px' }}>
                      Chỉnh sửa
                    </a>
                  </td>
                </tr>
              ))}
              {contracts.length === 0 && <tr><td colSpan={6} style={{ textAlign: 'center', color: 'var(--neutral-500)', padding: '24px' }}>Chưa có hợp đồng nào.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function SectionHistory({ requests }: { requests: any[] }) {
  const formatDate = (ds: string) => ds ? new Date(ds).toLocaleDateString('vi-VN', { hour: '2-digit', minute: '2-digit' }) : '--';
  return (
    <div style={{ background: '#fff', padding: '24px', borderRadius: 'var(--radius-lg)', border: '1px solid var(--neutral-200)', boxShadow: 'var(--shadow-sm)' }}>
      <h3 style={{ fontSize: '18px', fontWeight: 700, margin: '0 0 20px 0', color: 'var(--neutral-900)' }}>Lịch sử Yêu cầu ({requests.length})</h3>
      <div style={{ overflowX: 'auto', border: '1px solid var(--neutral-200)', borderRadius: 'var(--radius-md)' }}>
        <table className="custom-table" style={{ fontSize: '13px', margin: 0 }}>
          <thead><tr><th>Mã Phiếu</th><th>Ngày tạo</th><th>Loại yêu cầu</th><th>Mô tả nhu cầu</th><th>Trạng thái</th></tr></thead>
          <tbody>
            {requests.map(r => (
              <tr key={r.request_id}>
                <td style={{ fontWeight: 600, color: 'var(--primary-700)' }}>{r.request_id}</td>
                <td>{formatDate(r.submitted_at)}</td>
                <td><span style={{ fontWeight: 500 }}>{r.loai_khach_hang}</span></td>
                <td style={{ maxWidth: '300px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={r.mo_ta_nhu_cau}>{r.mo_ta_nhu_cau || '--'}</td>
                <td><span className="badge-custom" style={{ background: 'var(--primary-50)', color: 'var(--primary-700)' }}>Hoàn tất</span></td>
              </tr>
            ))}
            {requests.length === 0 && <tr><td colSpan={5} style={{ textAlign: 'center', color: 'var(--neutral-500)', padding: '24px' }}>Không có lịch sử yêu cầu nào.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
