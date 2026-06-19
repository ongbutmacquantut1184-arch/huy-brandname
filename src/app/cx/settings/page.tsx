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
    <div className="flex-col gap-6" style={{ maxWidth: '1000px', margin: '40px auto', padding: '0 24px' }}>
      <h1 className="text-2xl font-bold text-neutral m-0">Cấu hình Hệ thống</h1>
      <p className="text-muted mt-2 mb-6 text-sm">Quản lý các danh sách tuỳ chọn (Dropdowns) cho phiếu yêu cầu Sale.</p>

      <div className="flex gap-6 items-start">
        {/* Menu Tabs */}
        <div className="card-container flex-col gap-2 p-3" style={{ width: '280px', display: 'flex' }}>
          {CONFIG_KEYS.map(config => (
            <button
              key={config.key}
              onClick={() => setActiveTab(config.key)}
              style={{
                background: activeTab === config.key ? 'var(--primary-50)' : 'transparent',
                color: activeTab === config.key ? 'var(--primary-600)' : 'var(--neutral-700)',
                fontWeight: activeTab === config.key ? 600 : 500,
                border: 'none',
                padding: '12px 16px',
                borderRadius: 'var(--radius-sm)',
                textAlign: 'left',
                cursor: 'pointer',
                transition: 'var(--transition-fast)',
                fontSize: '14px'
              }}
            >
              {config.label}
            </button>
          ))}
        </div>

        {/* Editor */}
        <div className="card-container flex-1 p-6">
          <h2 className="text-xl font-bold mb-4">Chỉnh sửa: {activeConfig?.label}</h2>
          <p className="text-muted text-sm mb-4">
            Nhập mỗi giá trị trên một dòng mới. Những giá trị này sẽ hiển thị ở Form tạo phiếu của Sale.
          </p>

          <textarea
            value={currentValues.join('\n')}
            onChange={handleValuesChange}
            className="input-field mb-6"
            style={{
              minHeight: '300px',
              fontFamily: 'monospace',
              lineHeight: '1.6',
              resize: 'vertical',
            }}
          />

          <button 
            onClick={handleSave} 
            disabled={saving}
            className="btn btn-primary"
            style={{ padding: '12px 24px' }}
          >
            {saving ? 'Đang lưu...' : 'LƯU THAY ĐỔI'}
          </button>
        </div>
      </div>
    </div>
  );
}
