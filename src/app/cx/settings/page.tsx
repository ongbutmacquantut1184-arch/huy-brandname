"use client";

import React, { useEffect, useState } from 'react';
import { getDropdownConfigs, updateDropdownConfig } from '@/lib/cx-actions';
import { DROPDOWNS as FALLBACK_DROPDOWNS } from '@/lib/constants';

const CONFIG_KEYS = [
  { key: 'khuVuc', label: 'Khu vực' },
  { key: 'nganhNghe', label: 'Ngành nghề' },
  { key: 'phanKhuc', label: 'Phân khúc' },
  { key: 'loaiGoiCuoc', label: 'Loại gói cước' },
  { key: 'hinhThucSD', label: 'Hình thức sử dụng' },
  { key: 'hinhThucThanhToan', label: 'Hình thức thanh toán' },
  { key: 'kenhGuiTin', label: 'Kênh gửi tin' },
  { key: 'duLieuInput', label: 'Dữ liệu đầu vào' },
  { key: 'tenSale', label: 'Tên Sale' },
  { key: 'customerSuccess', label: 'Customer Success' },
  { key: 'customerSupport', label: 'Customer Support' },
  { key: 'loaiDichVu', label: 'Loại dịch vụ' },
];

export default function SettingsPage() {
  const [configs, setConfigs] = useState<Record<string, string[]>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState(CONFIG_KEYS[0].key);

  useEffect(() => {
    fetchConfigs();
  }, []);

  const fetchConfigs = async () => {
    setLoading(true);
    const res = await getDropdownConfigs();
    if (res.success && res.data) {
      const data = res.data as Record<string, string[]>;
      // Merge with fallback to ensure all keys exist
      const merged: Record<string, string[]> = {};
      CONFIG_KEYS.forEach(k => {
        merged[k.key] = data[k.key] && data[k.key].length > 0 
          ? data[k.key] 
          : (FALLBACK_DROPDOWNS as any)[k.key] || [];
      });
      setConfigs(merged);
    }
    setLoading(false);
  };

  const handleValuesChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const valStr = e.target.value;
    const arr = valStr.split('\n');
    setConfigs(prev => ({ ...prev, [activeTab]: arr }));
  };

  const handleSave = async () => {
    setSaving(true);
    const cleanedArr = (configs[activeTab] || []).filter((s: string) => s.trim() !== '');
    setConfigs(prev => ({ ...prev, [activeTab]: cleanedArr }));
    const res = await updateDropdownConfig(activeTab, cleanedArr);
    if (res.success) {
      alert('Lưu cấu hình thành công!');
    } else {
      alert(`Lỗi: ${res.error}`);
    }
    setSaving(false);
  };

  if (loading) return <div style={{ padding: '40px', textAlign: 'center' }}>Đang tải dữ liệu...</div>;

  const currentValues = configs[activeTab] || [];
  const activeConfig = CONFIG_KEYS.find(k => k.key === activeTab);

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div className="page-header">
        <div>
          <h1 style={{ fontSize: 'var(--text-2xl)', fontWeight: 800, color: 'var(--neutral-900)', margin: '0 0 4px 0' }}>
            Cấu hình Hệ thống
          </h1>
          <p style={{ fontSize: 'var(--text-sm)', color: 'var(--neutral-500)', margin: 0 }}>
            Quản lý các danh sách tuỳ chọn (Dropdowns) cho phiếu yêu cầu Sale.
          </p>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '24px', alignItems: 'flex-start' }}>
        {/* Menu Tabs */}
        <div className="card-container" style={{ width: '280px', display: 'flex', flexDirection: 'column', gap: '8px', padding: '16px' }}>
          {CONFIG_KEYS.map(config => (
            <button
              key={config.key}
              onClick={() => setActiveTab(config.key)}
              style={{
                background: activeTab === config.key ? 'var(--primary-50)' : 'transparent',
                color: activeTab === config.key ? 'var(--primary-700)' : 'var(--neutral-700)',
                fontWeight: activeTab === config.key ? 600 : 500,
                border: 'none',
                padding: '12px 16px',
                borderRadius: 'var(--radius-md)',
                textAlign: 'left',
                cursor: 'pointer',
                transition: 'var(--transition-fast)',
                fontSize: '14px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}
            >
              {config.label}
              {activeTab === config.key && (
                <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--primary-600)' }}></div>
              )}
            </button>
          ))}
        </div>

        {/* Editor */}
        <div className="card-container animate-fade-in-down" style={{ flex: 1, padding: '32px' }}>
          <h2 style={{ fontSize: '18px', fontWeight: 600, color: 'var(--primary-700)', marginBottom: '8px' }}>
            Chỉnh sửa: {activeConfig?.label}
          </h2>
          <p style={{ fontSize: '14px', color: 'var(--neutral-500)', marginBottom: '24px' }}>
            Nhập mỗi giá trị trên một dòng mới. Những giá trị này sẽ hiển thị ở Form tạo phiếu của Sale.
          </p>

          <textarea
            value={currentValues.join('\n')}
            onChange={handleValuesChange}
            className="input-field w-full"
            style={{
              minHeight: '400px',
              fontFamily: 'monospace',
              lineHeight: '1.6',
              resize: 'vertical',
              marginBottom: '24px',
              padding: '16px',
              fontSize: '14px',
              background: 'var(--neutral-50)'
            }}
          />

          <div style={{ display: 'flex', justifyContent: 'flex-end', borderTop: '1px solid var(--neutral-200)', paddingTop: '24px' }}>
            <button 
              onClick={handleSave} 
              disabled={saving}
              className="btn btn-primary"
              style={{ padding: '12px 32px', fontSize: '15px' }}
            >
              {saving ? 'Đang lưu...' : 'Lưu Thay Đổi'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
