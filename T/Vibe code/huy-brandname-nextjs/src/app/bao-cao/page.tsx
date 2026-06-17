"use client";

import { useEffect, useState } from 'react';
import { FileText, Download, Check, RefreshCw, Layers, ChevronUp, ChevronDown, Mail } from 'lucide-react';

const formatMonth = (m: string) => {
  if (!m) return '';
  const parts = m.split('-');
  return parts.length === 2 ? `${parts[1]}/${parts[0]}` : m;
};

export default function BaoCaoPage() {
  const [months, setMonths] = useState<string[]>([]);
  const [providers, setProviders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Filter States
  const [selectedMonth, setSelectedMonth] = useState('');
  const [selectedProviders, setSelectedProviders] = useState<string[]>([]);
  
  // Report Data States
  const [reportData, setReportData] = useState<Record<string, any> | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [activeMessage, setActiveMessage] = useState('');
  const [showFilters, setShowFilters] = useState(true);

  // Email Modal States
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [emailModalProvider, setEmailModalProvider] = useState('');
  const [emailModalValue, setEmailModalValue] = useState('');
  const [isSavingEmail, setIsSavingEmail] = useState(false);

  // Fetch initial months & providers lookup
  useEffect(() => {
    Promise.all([
      fetch('/api/reports/months').then(r => r.json()),
      fetch('/api/lookup').then(r => r.json())
    ])
      .then(([monthsData, lookupData]) => {
        setMonths(monthsData || []);
        setProviders(lookupData?.providers?.sort((a: any, b: any) => a.name.localeCompare(b.name)) || []);
        
        // Mặc định chọn tháng gần nhất nếu có
        if (monthsData && monthsData.length > 0) {
          setSelectedMonth(monthsData[0]);
        }
        setLoading(false);
      })
      .catch(err => {
        console.error('Lỗi tải dữ liệu ban đầu:', err);
        setLoading(false);
      });
  }, []);

  // Tự động quét và tick chọn nhà cung cấp khi thay đổi Tháng
  useEffect(() => {
    if (!selectedMonth || providers.length === 0) {
      setSelectedProviders([]);
      setReportData(null);
      setHasSearched(false);
      setActiveMessage('');
      return;
    }

    setActiveMessage('Đang quét nhà cung cấp có dữ liệu hủy...');
    fetch(`/api/reports/active-providers?month=${selectedMonth}`)
      .then(res => res.json())
      .then(activeIds => {
        setSelectedProviders(activeIds || []);
        setReportData(null);
        setHasSearched(false);
        if (!activeIds || activeIds.length === 0) {
          setActiveMessage('⚠️ Không có nhà cung cấp nào phát sinh hủy trong tháng này.');
        } else {
          setActiveMessage(`✓ Đã tìm thấy ${activeIds.length} nhà cung cấp có hủy. Hãy bấm Xem báo cáo.`);
        }
      })
      .catch(err => {
        console.error(err);
        setActiveMessage('⚠️ Lỗi kiểm tra dữ liệu tháng.');
      });
  }, [selectedMonth, providers.length]);

  const handleProviderToggle = (id: string) => {
    setSelectedProviders(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const handleSelectAllToggle = () => {
    if (selectedProviders.length === providers.length) {
      setSelectedProviders([]);
    } else {
      setSelectedProviders(providers.map(p => p.id));
    }
  };

  const handleViewReport = async () => {
    if (!selectedMonth) {
      alert('Vui lòng chọn Tháng.');
      return;
    }
    if (selectedProviders.length === 0) {
      alert('Vui lòng chọn ít nhất 1 nhà cung cấp.');
      return;
    }

    setIsSearching(true);
    setHasSearched(true);
    setReportData(null);

    const providersParam = selectedProviders.join(',');
    try {
      const res = await fetch(`/api/reports/data?month=${selectedMonth}&providers=${providersParam}`);
      const data = await res.json();
      setReportData(data);
    } catch (err) {
      console.error(err);
      alert('Lỗi tải dữ liệu báo cáo.');
    } finally {
      setIsSearching(false);
    }
  };

  const handleSaveEmail = async () => {
    if (!emailModalProvider) return;
    setIsSavingEmail(true);
    try {
      const res = await fetch('/api/providers', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: emailModalProvider, emails: emailModalValue.trim() })
      });
      if (res.ok) {
        // Cập nhật state providers cục bộ
        setProviders(prev => prev.map(p => p.id === emailModalProvider ? { ...p, emails: emailModalValue.trim() } : p));
        setShowEmailModal(false);
        alert('Cập nhật email thành công!');
      } else {
        alert('Có lỗi xảy ra khi lưu email.');
      }
    } catch (err) {
      console.error(err);
      alert('Lỗi kết nối.');
    } finally {
      setIsSavingEmail(false);
    }
  };

  const handleExport = (format: 'csv' | 'xlsx') => {
    if (!selectedMonth || selectedProviders.length === 0) {
      alert('Vui lòng chọn đầy đủ bộ lọc trước khi xuất.');
      return;
    }
    const providersParam = selectedProviders.join(',');
    window.open(`/api/reports/export?month=${selectedMonth}&providers=${providersParam}&format=${format}`, '_blank');
  };

  if (loading) return <div className="p-8 text-center text-gray">Đang tải dữ liệu báo cáo...</div>;

  const allSelected = selectedProviders.length === providers.length && providers.length > 0;
  const noneSelected = selectedProviders.length === 0;
  const isIndeterminate = !allSelected && !noneSelected;

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* Top Column: Filters (Collapsible) */}
      <div className="card-container p-0" style={{ overflow: 'hidden', boxShadow: 'var(--shadow-md)' }}>
        <div 
          style={{ padding: '18px 24px', background: '#FFFFFF', borderBottom: showFilters ? '1.5px solid var(--neutral-200)' : 'none', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', transition: 'var(--transition-fast)' }}
          onClick={() => setShowFilters(!showFilters)}
          className="hover-header-bg"
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <h2 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--neutral-900)', margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
              <Layers size={16} style={{ color: 'var(--primary-600)' }} /> Lập báo cáo hủy
            </h2>
            {!showFilters && selectedMonth && (
              <span className="badge-custom badge-primary" style={{ fontSize: '12.5px', padding: '4px 12px' }}>
                Tháng {formatMonth(selectedMonth)} • Chọn {selectedProviders.length} NCC
              </span>
            )}
          </div>
          <button style={{ background: 'none', border: 'none', color: 'var(--neutral-500)', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
            {showFilters ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
          </button>
        </div>

        {showFilters && (
          <div style={{ padding: '24px', display: 'flex', flexWrap: 'wrap', gap: '24px', alignItems: 'flex-start' }}>
            
            {/* Left Block: Month & Alerts */}
            <div style={{ flex: '0 0 240px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label className="label-custom">Tháng báo cáo</label>
                <select className="input-field" value={selectedMonth} onChange={e => setSelectedMonth(e.target.value)}>
                  <option value="">-- Chọn tháng --</option>
                  {months.map(m => (
                    <option key={m} value={m}>{formatMonth(m)}</option>
                  ))}
                </select>
              </div>

              {/* Message Alert */}
              {activeMessage && (
                <div style={{
                  fontSize: '13px',
                  padding: '12px 14px',
                  borderRadius: 'var(--radius-md)',
                  background: activeMessage.startsWith('⚠️') ? 'var(--warning-50)' : activeMessage.startsWith('✓') ? 'var(--success-50)' : 'var(--info-50)',
                  border: `1px solid ${activeMessage.startsWith('⚠️') ? 'var(--warning-100)' : activeMessage.startsWith('✓') ? 'var(--success-100)' : 'var(--info-100)'}`,
                  color: activeMessage.startsWith('⚠️') ? 'var(--warning-700)' : activeMessage.startsWith('✓') ? 'var(--success-700)' : 'var(--info-700)',
                  lineHeight: '1.4',
                  fontWeight: 500
                }}>
                  {activeMessage}
                </div>
              )}
            </div>

            {/* Middle Block: Provider List */}
            <div style={{ flex: '1 1 300px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <label className="label-custom" style={{ margin: 0 }}>Nhà cung cấp ({selectedProviders.length})</label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: 'var(--primary-700)', cursor: 'pointer', fontWeight: 600 }}>
                  <input 
                    type="checkbox" 
                    checked={allSelected} 
                    ref={el => {
                      if (el) el.indeterminate = isIndeterminate;
                    }}
                    onChange={handleSelectAllToggle}
                    className="custom-checkbox"
                  />
                  Tất cả
                </label>
              </div>
              
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(145px, 1fr))',
                gap: '8px',
                maxHeight: '260px',
                overflowY: 'auto',
                border: '1px solid var(--neutral-200)',
                borderRadius: 'var(--radius-md)',
                padding: '10px',
                boxShadow: 'var(--shadow-xs)',
                background: 'var(--neutral-50)'
              }}>
                {providers.map(p => {
                  const isChecked = selectedProviders.includes(p.id);
                  return (
                    <label key={p.id} style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '8px 10px',
                      borderRadius: 'var(--radius-sm)',
                      cursor: 'pointer',
                      background: isChecked ? 'var(--primary-50)' : '#FFFFFF',
                      border: isChecked ? '1px solid var(--primary-200)' : '1px solid var(--neutral-200)',
                      transition: 'var(--transition-fast)',
                      fontSize: '13px',
                      color: isChecked ? 'var(--primary-700)' : 'var(--neutral-700)',
                      fontWeight: isChecked ? 600 : 500,
                      boxShadow: isChecked ? '0 1px 2px rgba(0, 122, 255, 0.05)' : 'none'
                    }} className="provider-checkbox-label">
                      <input 
                        type="checkbox" 
                        checked={isChecked} 
                        onChange={() => handleProviderToggle(p.id)}
                        className="custom-checkbox"
                        style={{ flexShrink: 0 }}
                      />
                      <span style={{ textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>{p.name}</span>
                    </label>
                  );
                })}
              </div>
            </div>

            {/* Right Block: Actions */}
            <div style={{ flex: '0 0 180px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <button className="btn btn-primary" style={{ width: '100%', height: '42px', justifyContent: 'center' }} onClick={() => { handleViewReport(); setShowFilters(false); }} disabled={isSearching || !selectedMonth || selectedProviders.length === 0}>
                {isSearching ? 'Đang tải...' : 'Xem báo cáo'}
              </button>

              <button className="btn" style={{ padding: '10px', fontSize: '13px', background: 'linear-gradient(135deg, var(--success-600) 0%, var(--success-700) 100%)', border: '1px solid var(--success-700)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', boxShadow: '0 1px 2px rgba(21, 183, 158, 0.1)' }} onClick={() => handleExport('xlsx')} disabled={!selectedMonth || selectedProviders.length === 0} className="btn-success-gradient">
                <Download size={14} /> Xuất Excel
              </button>
              
              <button className="btn btn-secondary" style={{ padding: '10px', fontSize: '13px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }} onClick={() => handleExport('csv')} disabled={!selectedMonth || selectedProviders.length === 0}>
                <FileText size={14} /> Xuất CSV
              </button>

              <button className="btn" style={{ padding: '10px', fontSize: '13px', background: 'var(--primary-50)', color: 'var(--primary-700)', border: '1px solid var(--primary-200)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', marginTop: '4px', fontWeight: 600 }} onClick={() => setShowEmailModal(true)}>
                ✉️ Cập nhật Email NCC
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Main Column: Report Viewer */}
      <div className="card-container" style={{ overflow: 'hidden', flex: 1, boxShadow: 'var(--shadow-md)' }}>
        <div style={{ padding: '18px 24px', borderBottom: '1.5px solid var(--neutral-200)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--neutral-100)' }}>
          <h2 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--neutral-900)', margin: 0 }}>Kết quả Báo cáo</h2>
          {selectedMonth && (
            <span className="badge-custom badge-gold" style={{ fontSize: '12px', fontWeight: 600, padding: '4px 12px' }}>
              Tháng: {formatMonth(selectedMonth)}
            </span>
          )}
        </div>

        {!hasSearched ? (
          <div style={{ padding: '80px 40px', textAlign: 'center', color: 'var(--neutral-500)' }}>
            <Layers size={48} style={{ margin: '0 auto 16px auto', opacity: 0.4, color: 'var(--primary-400)' }} />
            <p style={{ fontSize: '15px', margin: 0, fontWeight: 500 }}>Vui lòng chọn bộ lọc và bấm <strong>Xem báo cáo</strong>.</p>
          </div>
        ) : isSearching ? (
          <div style={{ padding: '80px 40px', textAlign: 'center', color: 'var(--neutral-500)' }}>
            <RefreshCw className="spin" size={36} style={{ margin: '0 auto 16px auto', opacity: 0.6, color: 'var(--primary-600)' }} />
            <p style={{ fontSize: '15px', margin: 0, fontWeight: 500 }}>Đang truy vấn cơ sở dữ liệu và tổng hợp số liệu...</p>
          </div>
        ) : !reportData || Object.keys(reportData).length === 0 || Object.values(reportData).every((x: any) => x.brands.length === 0) ? (
          <div style={{ padding: '80px 40px', textAlign: 'center', color: 'var(--neutral-500)' }}>
            <FileText size={48} style={{ margin: '0 auto 16px auto', opacity: 0.4, color: 'var(--neutral-400)' }} />
            <p style={{ fontSize: '15px', margin: 0, fontWeight: 500 }}>Không có dữ liệu hủy nào khớp với điều kiện đã chọn.</p>
          </div>
        ) : (
          <div style={{ padding: '24px', maxHeight: 'calc(100vh - 200px)', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '32px' }}>
            {selectedProviders
              .filter(pid => reportData[pid] && reportData[pid].brands.length > 0)
              .sort((a, b) => {
                const aCount = reportData[a].brands.length;
                const bCount = reportData[b].brands.length;
                if (bCount !== aCount) return bCount - aCount;
                const aName = providers.find(p => p.id === a)?.name || '';
                const bName = providers.find(p => p.id === b)?.name || '';
                return aName.localeCompare(bName);
              })
              .map(pid => {
                const data = reportData[pid];
                const providerName = providers.find(p => p.id === pid)?.name || pid;

                return (
                  <div key={pid} className="report-table-container">
                    <h3 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--primary-700)', marginBottom: '14px', borderBottom: '2.5px solid var(--primary-100)', paddingBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>📦 {providerName}</span>
                      <span className="badge-custom badge-primary" style={{ padding: '4px 10px', fontSize: '12px' }}>
                        {data.brands.length} brandname
                      </span>
                    </h3>

                    <div style={{ overflowX: 'auto', border: '1px solid var(--neutral-200)', borderRadius: 'var(--radius-md)', boxShadow: 'var(--shadow-xs)', background: '#FFFFFF' }}>
                      <table className="custom-table" style={{ fontSize: '13.5px' }}>
                        <thead>
                          <tr>
                            <th style={{ textAlign: 'center', width: '60px' }}>STT</th>
                            <th>Brandname</th>
                            {data.operators.map((op: any) => (
                              <th key={op.id} style={{ textAlign: 'center' }}>Hủy {op.name}</th>
                            ))}
                            <th>CP_Name</th>
                          </tr>
                        </thead>
                        <tbody>
                          {data.brands.map((brand: any, idx: number) => (
                            <tr key={idx} className="report-row">
                              <td style={{ textAlign: 'center', color: 'var(--neutral-400)' }}>{idx + 1}</td>
                              <td style={{ fontWeight: 600, color: 'var(--neutral-900)' }}>{brand.brandName}</td>
                              {data.operators.map((op: any) => {
                                const status = brand.operatorStatus[op.id] || '-';
                                const isYes = status === 'Yes';
                                return (
                                  <td key={op.id} style={{ textAlign: 'center' }}>
                                    {isYes ? (
                                      <span className="badge-custom badge-success" style={{ padding: '2px 8px', fontSize: '11px' }}>Yes</span>
                                    ) : (
                                      <span style={{ color: 'var(--neutral-400)' }}>-</span>
                                    )}
                                  </td>
                                );
                              })}
                              <td style={{ color: 'var(--neutral-600)', fontWeight: 500 }}>{brand.cp}</td>
                            </tr>
                          ))}
                          {providers.find(p => p.id === pid)?.emails && (
                            <tr style={{ background: 'var(--neutral-50)' }}>
                              <td colSpan={data.operators.length + 3} style={{ padding: '12px 16px', color: 'var(--neutral-500)', fontSize: '13px', fontStyle: 'italic', borderTop: '1px solid var(--neutral-200)' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                  <Mail size={14} style={{ color: 'var(--primary-600)' }} />
                                  <strong>Email gửi NCC: </strong>
                                  <span>{providers.find(p => p.id === pid)?.emails}</span>
                                </div>
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                );
              })}
          </div>
        )}
      </div>

      <style dangerouslySetInnerHTML={{__html: `
        .label-custom { display: block; font-size: 13px; font-weight: 600; margin-bottom: 8px; color: var(--neutral-700); }
        .hover-header-bg:hover {
          background-color: var(--neutral-50) !important;
        }
        .provider-checkbox-label:hover {
          border-color: var(--primary-400) !important;
          background-color: var(--primary-50) !important;
        }
        .report-row:hover td {
          background-color: var(--neutral-50) !important;
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .spin {
          animation: spin 1s linear infinite;
        }
        .btn-success-gradient {
          border-color: var(--success-700) !important;
          color: #fff !important;
          transition: var(--transition-fast) !important;
        }
        .btn-success-gradient:hover {
          background: linear-gradient(135deg, var(--success-700) 0%, var(--success-700) 100%) !important;
          box-shadow: 0 4px 12px rgba(21, 183, 158, 0.25) !important;
        }
      `}} />

      {/* Modal Cập nhật Email NCC */}
      {showEmailModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(12, 17, 29, 0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999, backdropFilter: 'blur(4px)' }}>
          <div className="card-container animate-fade-in" style={{ width: '450px', padding: '28px', boxShadow: 'var(--shadow-xl)', border: '1px solid var(--neutral-300)' }}>
            <h3 style={{ margin: '0 0 18px 0', fontSize: '17px', fontWeight: 700, color: 'var(--neutral-900)', borderBottom: '1.5px solid var(--neutral-200)', paddingBottom: '12px' }}>Cập nhật Email Nhà Cung Cấp</h3>
            
            <div style={{ marginBottom: '18px' }}>
              <label className="label-custom">Nhà cung cấp</label>
              <select 
                className="input-field" 
                value={emailModalProvider} 
                onChange={e => {
                  setEmailModalProvider(e.target.value);
                  const p = providers.find(x => x.id === e.target.value);
                  setEmailModalValue(p?.emails || '');
                }}
              >
                <option value="">-- Chọn Nhà Cung Cấp --</option>
                {providers.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>

            <div style={{ marginBottom: '24px' }}>
              <label className="label-custom">Danh sách Email (ngăn cách bởi dấu chấm phẩy ;)</label>
              <textarea 
                className="input-field" 
                rows={4} 
                value={emailModalValue}
                onChange={e => setEmailModalValue(e.target.value)}
                placeholder="vidu1@gmail.com; vidu2@gmail.com"
                style={{ fontSize: '13.5px', resize: 'none' }}
              />
            </div>

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button className="btn btn-secondary" onClick={() => setShowEmailModal(false)} disabled={isSavingEmail}>Hủy</button>
              <button className="btn btn-primary" onClick={handleSaveEmail} disabled={isSavingEmail || !emailModalProvider}>
                {isSavingEmail ? 'Đang lưu...' : 'Lưu lại'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
