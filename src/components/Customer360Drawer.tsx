'use client';

import React, { useEffect, useState } from 'react';
import { Eye, EyeOff, LayoutDashboard, FileText, Database, ShieldAlert, X } from 'lucide-react';
import { getCustomer360 } from '@/lib/cx-actions';
import Drawer from '@/components/ui/Drawer';
import StatusBadge from '@/components/ui/StatusBadge';
import SkeletonLoader from '@/components/ui/SkeletonLoader';

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

  const title = (
    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
      <span>Hồ sơ Khách hàng 360</span>
      {data?.customer?.loai_khach_hang && (
        <span className="badge-custom" style={{ background: 'var(--primary-100)', color: 'var(--primary-800)', fontSize: '13px' }}>
          {data.customer.loai_khach_hang}
        </span>
      )}
    </div>
  );

  return (
    <Drawer isOpen={isOpen} onClose={onClose} title={title as any} width="1100px">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
        {loading ? (
          <SkeletonLoader rows={8} />
        ) : !data ? (
          <div style={{ textAlign: 'center', padding: '40px', color: 'var(--error-600)' }}>Không tìm thấy thông tin khách hàng.</div>
        ) : (
          <>
            <SectionInfo customer={data.customer} />
            <SectionServices contracts={data.contracts} services={data.services} />
            <SectionCancelLogs logs={data.cancelLogs} />
            <SectionHistory requests={data.requests} />
          </>
        )}
      </div>
    </Drawer>
  );
}

function SectionInfo({ customer }: { customer: any }) {
  const [showPassword, setShowPassword] = useState(false);
  if (!customer) return <div style={{ color: 'var(--neutral-500)' }}>Chưa có thông tin.</div>;
  const formatDate = (ds: string) => ds ? new Date(ds).toLocaleDateString('vi-VN') : '--';
  return (
    <div className="card-container" style={{ padding: 'var(--space-6)' }}>
      <h3 style={{ fontSize: 'var(--text-lg)', fontWeight: 700, margin: '0 0 var(--space-5) 0', color: 'var(--neutral-900)', display: 'flex', alignItems: 'center', gap: '8px' }}>
        <LayoutDashboard size={20} color="var(--primary-600)" />
        Thông tin chung
      </h3>
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--space-5)' }}>
        <div><label className="label-custom" style={{ fontSize: '13px', color: 'var(--neutral-500)', display: 'block', marginBottom: '4px' }}>Mã khách hàng</label><div style={{ fontWeight: 600, color: 'var(--neutral-900)' }}>{customer.customer_id || '--'}</div></div>
        <div style={{ gridColumn: 'span 2' }}><label className="label-custom" style={{ fontSize: '13px', color: 'var(--neutral-500)', display: 'block', marginBottom: '4px' }}>Tên công ty</label><div style={{ fontWeight: 600, color: 'var(--neutral-900)' }}>{customer.ten_cong_ty || '--'}</div></div>
        <div><label className="label-custom" style={{ fontSize: '13px', color: 'var(--neutral-500)', display: 'block', marginBottom: '4px' }}>Mã số thuế</label><div style={{ fontWeight: 500, color: 'var(--neutral-800)' }}>{customer.ma_so_thue || '--'}</div></div>
        
        <div><label className="label-custom" style={{ fontSize: '13px', color: 'var(--neutral-500)', display: 'block', marginBottom: '4px' }}>Khu vực</label><div style={{ fontWeight: 500, color: 'var(--neutral-800)' }}>{customer.khu_vuc || '--'}</div></div>
        <div><label className="label-custom" style={{ fontSize: '13px', color: 'var(--neutral-500)', display: 'block', marginBottom: '4px' }}>Quốc gia</label><div style={{ fontWeight: 500, color: 'var(--neutral-800)' }}>{customer.quoc_gia || '--'}</div></div>
        <div><label className="label-custom" style={{ fontSize: '13px', color: 'var(--neutral-500)', display: 'block', marginBottom: '4px' }}>Phân khúc</label><div style={{ fontWeight: 500, color: 'var(--neutral-800)' }}>{customer.phan_khuc || '--'}</div></div>
        <div><label className="label-custom" style={{ fontSize: '13px', color: 'var(--neutral-500)', display: 'block', marginBottom: '4px' }}>Ngày bắt đầu SD</label><div style={{ fontWeight: 500, color: 'var(--neutral-800)' }}>{formatDate(customer.ngay_bat_dau_sd)}</div></div>
      </div>

      <div style={{ height: '1px', background: 'var(--neutral-200)', margin: 'var(--space-6) 0' }} />

      <h4 style={{ fontSize: 'var(--text-base)', fontWeight: 600, margin: '0 0 var(--space-4) 0', color: 'var(--neutral-800)', display: 'flex', alignItems: 'center', gap: '8px' }}>
        <Database size={18} color="var(--neutral-500)" /> Dữ liệu Hệ thống & Nguồn
      </h4>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--space-5)' }}>
        <div><label className="label-custom" style={{ fontSize: '13px', color: 'var(--neutral-500)', display: 'block', marginBottom: '4px' }}>Org ID</label><div style={{ fontWeight: 600, color: 'var(--neutral-900)' }}>{customer.org_id || '--'}</div></div>
        <div><label className="label-custom" style={{ fontSize: '13px', color: 'var(--neutral-500)', display: 'block', marginBottom: '4px' }}>CPID</label><div style={{ fontWeight: 600, color: 'var(--neutral-900)' }}>{customer.cpid || '--'}</div></div>
        <div><label className="label-custom" style={{ fontSize: '13px', color: 'var(--neutral-500)', display: 'block', marginBottom: '4px' }}>CP Name</label><div style={{ fontWeight: 600, color: 'var(--neutral-900)' }}>{customer.cp_name || '--'}</div></div>
        <div><label className="label-custom" style={{ fontSize: '13px', color: 'var(--neutral-500)', display: 'block', marginBottom: '4px' }}>Tài khoản</label><div style={{ fontWeight: 600, color: 'var(--primary-700)' }}>{customer.ten_tai_khoan || '--'}</div></div>
        <div>
          <label className="label-custom" style={{ fontSize: '13px', color: 'var(--neutral-500)', display: 'block', marginBottom: '4px' }}>Mật khẩu</label>
          <div style={{ fontWeight: 600, color: 'var(--neutral-900)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            {showPassword ? (customer.mat_khau || '--') : (customer.mat_khau ? '••••••' : '--')}
            {customer.mat_khau && (
              <button 
                onClick={() => setShowPassword(!showPassword)} 
                title={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                style={{ background: 'var(--neutral-100)', border: 'none', padding: '4px', cursor: 'pointer', display: 'flex', color: 'var(--neutral-600)', borderRadius: '4px' }}
              >
                {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            )}
          </div>
        </div>
        <div><label className="label-custom" style={{ fontSize: '13px', color: 'var(--neutral-500)', display: 'block', marginBottom: '4px' }}>Email tạo TK</label><div style={{ fontWeight: 500, color: 'var(--neutral-800)' }}>{customer.email_tao_tk || '--'}</div></div>
        <div><label className="label-custom" style={{ fontSize: '13px', color: 'var(--neutral-500)', display: 'block', marginBottom: '4px' }}>Kênh gửi tin</label><div style={{ fontWeight: 500, color: 'var(--neutral-800)' }}>{customer.kenh_gui_tin || '--'}</div></div>
        <div><label className="label-custom" style={{ fontSize: '13px', color: 'var(--neutral-500)', display: 'block', marginBottom: '4px' }}>Dữ liệu Input</label><div style={{ fontWeight: 500, color: 'var(--neutral-800)' }}>{customer.du_lieu_input || '--'}</div></div>
      </div>

      <div style={{ height: '1px', background: 'var(--neutral-200)', margin: 'var(--space-6) 0' }} />

      <h4 style={{ fontSize: 'var(--text-base)', fontWeight: 600, margin: '0 0 var(--space-4) 0', color: 'var(--neutral-800)', display: 'flex', alignItems: 'center', gap: '8px' }}>
        <FileText size={18} color="var(--neutral-500)" /> Liên hệ & Phụ trách
      </h4>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--space-5)' }}>
        <div><label className="label-custom" style={{ fontSize: '13px', color: 'var(--neutral-500)', display: 'block', marginBottom: '4px' }}>Số điện thoại</label><div style={{ fontWeight: 500, color: 'var(--neutral-800)' }}>{customer.so_dien_thoai || '--'}</div></div>
        <div><label className="label-custom" style={{ fontSize: '13px', color: 'var(--neutral-500)', display: 'block', marginBottom: '4px' }}>Contact phối hợp</label><div style={{ fontWeight: 500, color: 'var(--neutral-800)' }}>{customer.contact_phoi_hop || '--'}</div></div>
        <div><label className="label-custom" style={{ fontSize: '13px', color: 'var(--neutral-500)', display: 'block', marginBottom: '4px' }}>Sale phụ trách</label><div style={{ fontWeight: 600, color: 'var(--amber-600)' }}>{customer.sale_phu_trach || customer.sale_in_charge || '--'}</div></div>
        <div><label className="label-custom" style={{ fontSize: '13px', color: 'var(--neutral-500)', display: 'block', marginBottom: '4px' }}>Customer Success</label><div style={{ fontWeight: 600, color: 'var(--primary-600)' }}>{customer.customer_success || customer.cs_in_charge || '--'}</div></div>
        <div style={{ gridColumn: 'span 2' }}><label className="label-custom" style={{ fontSize: '13px', color: 'var(--neutral-500)', display: 'block', marginBottom: '4px' }}>Mô tả nhu cầu từ Sale</label><div style={{ fontWeight: 500, color: 'var(--neutral-800)' }}>{customer.mo_ta_nhu_cau_tu_sale || '--'}</div></div>
      </div>
    </div>
  );
}

function SectionServices({ contracts, services }: { contracts: any[], services: any[] }) {
  const formatDate = (ds: string) => ds ? new Date(ds).toLocaleDateString('vi-VN') : '--';
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 'var(--space-6)' }}>
      <div className="card-container" style={{ padding: 'var(--space-6)' }}>
        <h3 style={{ fontSize: 'var(--text-lg)', fontWeight: 700, margin: '0 0 var(--space-4) 0', color: 'var(--neutral-900)' }}>Dịch vụ đang sử dụng ({services.length})</h3>
        <div style={{ overflowX: 'auto', border: '1px solid var(--neutral-200)', borderRadius: 'var(--radius-md)' }}>
          <table className="custom-table" style={{ fontSize: '13px', margin: 0, minWidth: '800px' }}>
            <thead><tr><th>Mã DV</th><th>Loại DV</th><th>Brand/OA</th><th>CP Name</th><th>Bắt đầu</th><th>Hết hạn</th><th>Trạng thái</th><th>SUP</th><th style={{ textAlign: 'center' }}>Thao tác</th></tr></thead>
            <tbody>
              {services.map(s => (
                <tr key={s.service_id}>
                  <td style={{ fontWeight: 600, color: 'var(--primary-700)' }}>{s.service_id}</td>
                  <td style={{ fontWeight: 500, color: 'var(--neutral-800)' }}>{s.loai_dich_vu}</td>
                  <td style={{ color: 'var(--neutral-600)' }}>{s.brand_name_oa || '--'}</td>
                  <td>{s.cp_name_code || '--'}</td>
                  <td>{formatDate(s.ngay_bat_dau)}</td>
                  <td>{formatDate(s.ngay_het_han)}</td>
                  <td><StatusBadge status={s.trang_thai} /></td>
                  <td style={{ fontWeight: 600, color: 'var(--amber-700)' }}>{s.customer_support || '--'}</td>
                  <td style={{ textAlign: 'center' }}>
                    <a href={`/cx/services?edit=${s.service_id}`} target="_blank" rel="noopener noreferrer" className="btn btn-secondary hover-bg-gray" style={{ textDecoration: 'none', padding: '4px 12px', fontSize: '13px' }}>
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
      
      <div className="card-container" style={{ padding: 'var(--space-6)' }}>
        <h3 style={{ fontSize: 'var(--text-lg)', fontWeight: 700, margin: '0 0 var(--space-4) 0', color: 'var(--neutral-900)' }}>Danh sách Hợp đồng ({contracts.length})</h3>
        <div style={{ overflowX: 'auto', border: '1px solid var(--neutral-200)', borderRadius: 'var(--radius-md)' }}>
          <table className="custom-table" style={{ fontSize: '13px', margin: 0 }}>
            <thead><tr><th>Mã Hợp đồng</th><th>Số HĐ / PO</th><th>Loại HĐ</th><th>Bắt đầu</th><th>Kết thúc</th><th>Trạng thái</th><th style={{ textAlign: 'center' }}>Thao tác</th></tr></thead>
            <tbody>
              {contracts.map(c => (
                <tr key={c.contract_id}>
                  <td style={{ fontWeight: 600, color: 'var(--primary-700)' }}>{c.contract_id}</td>
                  <td style={{ fontWeight: 500, color: 'var(--neutral-800)' }}>{c.so_hop_dong || '--'}</td>
                  <td>{c.loai_hop_dong === 'Campaign' ? <StatusBadge status="Campaign" variant="warning" /> : <StatusBadge status="Subscription" variant="info" />}</td>
                  <td>{formatDate(c.ngay_bat_dau_hd)}</td>
                  <td>{formatDate(c.ngay_ket_thuc_hd)}</td>
                  <td><StatusBadge status={c.trang_thai} /></td>
                  <td style={{ textAlign: 'center' }}>
                    <a href={`/cx/contracts?edit=${c.contract_id}`} target="_blank" rel="noopener noreferrer" className="btn btn-secondary hover-bg-gray" style={{ textDecoration: 'none', padding: '4px 12px', fontSize: '13px' }}>
                      Chỉnh sửa
                    </a>
                  </td>
                </tr>
              ))}
              {contracts.length === 0 && <tr><td colSpan={7} style={{ textAlign: 'center', color: 'var(--neutral-500)', padding: '24px' }}>Chưa có hợp đồng nào.</td></tr>}
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
    <div className="card-container" style={{ padding: 'var(--space-6)' }}>
      <h3 style={{ fontSize: 'var(--text-lg)', fontWeight: 700, margin: '0 0 var(--space-4) 0', color: 'var(--neutral-900)' }}>Lịch sử Yêu cầu ({requests.length})</h3>
      <div style={{ overflowX: 'auto', border: '1px solid var(--neutral-200)', borderRadius: 'var(--radius-md)' }}>
        <table className="custom-table" style={{ fontSize: '13px', margin: 0 }}>
          <thead><tr><th>Mã Phiếu</th><th>Ngày tạo</th><th>Loại yêu cầu</th><th>Mô tả nhu cầu</th><th>Trạng thái</th></tr></thead>
          <tbody>
            {requests.map(r => (
              <tr key={r.request_id}>
                <td style={{ fontWeight: 600, color: 'var(--primary-700)' }}>{r.request_id}</td>
                <td>{formatDate(r.submitted_at)}</td>
                <td><span style={{ fontWeight: 500 }}>{r.loai_yeu_cau}</span></td>
                <td style={{ maxWidth: '300px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={r.mo_ta_nhu_cau}>{r.mo_ta_nhu_cau || '--'}</td>
                <td><StatusBadge status="Hoàn tất" variant="success" /></td>
              </tr>
            ))}
            {requests.length === 0 && <tr><td colSpan={5} style={{ textAlign: 'center', color: 'var(--neutral-500)', padding: '24px' }}>Không có lịch sử yêu cầu nào.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function SectionCancelLogs({ logs }: { logs: any[] }) {
  if (!logs || logs.length === 0) return null;
  const formatDate = (ds: string) => ds ? new Date(ds).toLocaleDateString('vi-VN', { hour: '2-digit', minute: '2-digit' }) : '--';
  return (
    <div className="card-container" style={{ padding: 'var(--space-6)', border: '1px solid var(--error-200)' }}>
      <h3 style={{ fontSize: 'var(--text-lg)', fontWeight: 700, margin: '0 0 var(--space-4) 0', color: 'var(--error-700)', display: 'flex', alignItems: 'center', gap: '8px' }}>
        <ShieldAlert size={20} /> Lịch sử Hủy Dịch vụ ({logs.length})
      </h3>
      <div style={{ overflowX: 'auto', border: '1px solid var(--neutral-200)', borderRadius: 'var(--radius-md)' }}>
        <table className="custom-table" style={{ fontSize: '13px', margin: 0 }}>
          <thead><tr><th>Thời gian</th><th>Người thực hiện</th><th>Dịch vụ liên quan</th><th>Lý do / Chi tiết</th></tr></thead>
          <tbody>
            {logs.map((l, i) => (
              <tr key={i}>
                <td style={{ whiteSpace: 'nowrap' }}>{formatDate(l.created_at)}</td>
                <td style={{ fontWeight: 500 }}>{l.performed_by || '--'}</td>
                <td style={{ color: 'var(--primary-700)', fontWeight: 600 }}>{l.target_id || '--'}</td>
                <td>{l.detail || '--'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
