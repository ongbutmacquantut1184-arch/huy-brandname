"use client";

import { useEffect, useState } from 'react';
import { FileText, Download, Check, RefreshCw, Layers } from 'lucide-react';

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

  // Fetch initial months & providers lookup
  useEffect(() => {
    const cached = sessionStorage.getItem('lookups_cache');
    if (cached) {
      try {
        const lookupData = JSON.parse(cached);
        setProviders(lookupData?.providers?.sort((a: any, b: any) => a.name.localeCompare(b.name)) || []);
        setLoading(false);
      } catch (e) {}
    }

    Promise.all([
      fetch('/api/reports/months').then(r => r.json()),
      fetch('/api/lookup').then(r => r.json())
    ])
      .then(([monthsData, lookupData]) => {
        setMonths(monthsData || []);
        setProviders(lookupData?.providers?.sort((a: any, b: any) => a.name.localeCompare(b.name)) || []);
        sessionStorage.setItem('lookups_cache', JSON.stringify(lookupData));
        
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
    <div className="animate-fade-in" style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: '24px' }}>
      
      {/* Left Column: Filters */}
      <div className="apple-card p-6" style={{ alignSelf: 'start', position: 'sticky', top: '24px' }}>
        <h2 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Layers size={16} /> Lập báo cáo hủy
        </h2>

        {/* Month Filter */}
        <div style={{ marginBottom: '20px' }}>
          <label className="apple-label">Tháng báo cáo</label>
          <select className="apple-input" value={selectedMonth} onChange={e => setSelectedMonth(e.target.value)}>
            <option value="">-- Chọn tháng --</option>
            {months.map(m => (
              <option key={m} value={m}>{formatMonth(m)}</option>
            ))}
          </select>
        </div>

        {/* Message Alert */}
        {activeMessage && (
          <div style={{
            fontSize: '12.5px',
            padding: '10px 12px',
            borderRadius: '8px',
            background: activeMessage.startsWith('⚠️') ? 'rgba(255, 159, 10, 0.08)' : activeMessage.startsWith('✓') ? 'rgba(52, 199, 89, 0.08)' : 'rgba(0,122,255,0.06)',
            border: `1px solid ${activeMessage.startsWith('⚠️') ? 'rgba(255, 159, 10, 0.25)' : activeMessage.startsWith('✓') ? 'rgba(52, 199, 89, 0.25)' : 'rgba(0,122,255,0.15)'}`,
            color: activeMessage.startsWith('⚠️') ? '#905b00' : activeMessage.startsWith('✓') ? '#1d702d' : 'var(--apple-blue)',
            marginBottom: '20px',
            lineHeight: '1.4'
          }}>
            {activeMessage}
          </div>
        )}

        {/* Provider List Filter */}
        <div style={{ marginBottom: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <label className="apple-label" style={{ margin: 0 }}>Nhà cung cấp ({selectedProviders.length})</label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12.5px', color: 'var(--apple-blue)', cursor: 'pointer', fontWeight: 500 }}>
              <input 
                type="checkbox" 
                checked={allSelected} 
                ref={el => {
                  if (el) el.indeterminate = isIndeterminate;
                }}
                onChange={handleSelectAllToggle}
                style={{ accentColor: 'var(--apple-blue)' }}
              />
              Tất cả
            </label>
          </div>
          
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(135px, 1fr))',
            gap: '8px',
            maxHeight: '260px',
            overflowY: 'auto',
            border: '1px solid var(--apple-gray-4)',
            borderRadius: '10px',
            padding: '8px'
          }}>
            {providers.map(p => {
              const isChecked = selectedProviders.includes(p.id);
              return (
                <label key={p.id} style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '8px 10px',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  background: isChecked ? 'rgba(0,122,255,0.04)' : 'transparent',
                  transition: 'background 0.2s',
                  fontSize: '13px',
                  color: isChecked ? 'var(--apple-blue)' : 'var(--apple-black)',
                  fontWeight: isChecked ? 500 : 400
                }} className="provider-checkbox-label">
                  <input 
                    type="checkbox" 
                    checked={isChecked} 
                    onChange={() => handleProviderToggle(p.id)}
                    style={{ accentColor: 'var(--apple-blue)', transform: 'scale(1.05)' }}
                  />
                  <span style={{ textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>{p.name}</span>
                </label>
              );
            })}
          </div>
        </div>

        <button className="apple-btn apple-btn-primary" style={{ width: '100%', marginBottom: '12px' }} onClick={handleViewReport} disabled={isSearching || !selectedMonth || selectedProviders.length === 0}>
          {isSearching ? 'Đang tổng hợp...' : 'Xem báo cáo'}
        </button>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
          <button className="apple-btn" style={{ padding: '8px', fontSize: '12.5px', background: '#34c759', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }} onClick={() => handleExport('xlsx')} disabled={!selectedMonth || selectedProviders.length === 0}>
            <Download size={14} /> Excel
          </button>
          <button className="apple-btn" style={{ padding: '8px', fontSize: '12.5px', background: 'var(--apple-gray-4)', color: 'var(--apple-black)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }} onClick={() => handleExport('csv')} disabled={!selectedMonth || selectedProviders.length === 0}>
            <FileText size={14} /> CSV
          </button>
        </div>
      </div>

      {/* Right Column: Report Viewer */}
      <div className="apple-card p-0" style={{ overflow: 'hidden', minHeight: '400px' }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--apple-gray-4)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--apple-gray-4)' }}>
          <h2 style={{ fontSize: '16px', fontWeight: 600, margin: 0 }}>Kết quả Báo cáo</h2>
          {selectedMonth && (
            <span style={{ fontSize: '12.5px', color: 'var(--apple-gray-1)', fontWeight: 500 }}>
              Tháng: {formatMonth(selectedMonth)}
            </span>
          )}
        </div>

        {!hasSearched ? (
          <div style={{ padding: '80px 40px', textAlign: 'center', color: 'var(--apple-gray-1)' }}>
            <Layers size={48} style={{ margin: '0 auto 16px auto', opacity: 0.25 }} />
            <p style={{ fontSize: '15px', margin: 0 }}>Vui lòng chọn bộ lọc ở cột bên trái và bấm <strong>Xem báo cáo</strong>.</p>
          </div>
        ) : isSearching ? (
          <div style={{ padding: '80px 40px', textAlign: 'center', color: 'var(--apple-gray-1)' }}>
            <RefreshCw className="spin" size={36} style={{ margin: '0 auto 16px auto', opacity: 0.6 }} />
            <p style={{ fontSize: '15px', margin: 0 }}>Đang truy vấn cơ sở dữ liệu và tổng hợp số liệu...</p>
          </div>
        ) : !reportData || Object.keys(reportData).length === 0 || Object.values(reportData).every((x: any) => x.brands.length === 0) ? (
          <div style={{ padding: '80px 40px', textAlign: 'center', color: 'var(--apple-gray-1)' }}>
            <FileText size={48} style={{ margin: '0 auto 16px auto', opacity: 0.25 }} />
            <p style={{ fontSize: '15px', margin: 0 }}>Không có dữ liệu hủy nào khớp với điều kiện đã chọn.</p>
          </div>
        ) : (
          <div style={{ padding: '20px', maxHeight: 'calc(100vh - 120px)', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '32px' }}>
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
                  <h3 style={{ fontSize: '15px', fontWeight: 600, color: 'var(--apple-blue)', marginBottom: '14px', borderBottom: '2px solid rgba(0,122,255,0.1)', paddingBottom: '6px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span>📦 {providerName}</span>
                    <span style={{ fontSize: '12px', background: 'rgba(0,122,255,0.08)', color: 'var(--apple-blue)', padding: '2px 8px', borderRadius: '100px', fontWeight: 500 }}>
                      {data.brands.length} brandname
                    </span>
                  </h3>

                  <div style={{ overflowX: 'auto', border: '1px solid var(--apple-gray-4)', borderRadius: '10px' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                      <thead>
                        <tr>
                          <th style={{ textAlign: 'center', padding: '10px 12px', background: 'var(--apple-gray-5)', color: 'var(--apple-gray-1)', fontWeight: 600, borderBottom: '1px solid var(--apple-gray-4)', width: '50px' }}>STT</th>
                          <th style={{ textAlign: 'left', padding: '10px 12px', background: 'var(--apple-gray-5)', color: 'var(--apple-gray-1)', fontWeight: 600, borderBottom: '1px solid var(--apple-gray-4)' }}>Brandname</th>
                          {data.operators.map((op: any) => (
                            <th key={op.id} style={{ textAlign: 'center', padding: '10px 12px', background: 'var(--apple-gray-5)', color: 'var(--apple-gray-1)', fontWeight: 600, borderBottom: '1px solid var(--apple-gray-4)' }}>Hủy {op.name}</th>
                          ))}
                          <th style={{ textAlign: 'left', padding: '10px 12px', background: 'var(--apple-gray-5)', color: 'var(--apple-gray-1)', fontWeight: 600, borderBottom: '1px solid var(--apple-gray-4)' }}>Lĩnh vực (CP)</th>
                          <th style={{ textAlign: 'left', padding: '10px 12px', background: 'var(--apple-gray-5)', color: 'var(--apple-gray-1)', fontWeight: 600, borderBottom: '1px solid var(--apple-gray-4)' }}>Đơn vị sử dụng</th>
                        </tr>
                      </thead>
                      <tbody>
                        {data.brands.map((brand: any, idx: number) => (
                          <tr key={idx} style={{ borderBottom: '1px solid var(--apple-gray-5)' }} className="report-row">
                            <td style={{ padding: '10px 12px', textAlign: 'center', color: 'var(--apple-gray-1)' }}>{idx + 1}</td>
                            <td style={{ padding: '10px 12px', fontWeight: 600, color: 'var(--apple-black)' }}>{brand.brandName}</td>
                            {data.operators.map((op: any) => {
                              const status = brand.operatorStatus[op.id] || '-';
                              const isYes = status === 'Yes';
                              return (
                                <td key={op.id} style={{
                                  padding: '10px 12px',
                                  textAlign: 'center',
                                  color: isYes ? '#24963e' : 'var(--apple-gray-1)',
                                  fontWeight: isYes ? 600 : 400
                                }}>
                                  {isYes ? <span style={{ background: 'rgba(52, 199, 89, 0.12)', padding: '2px 8px', borderRadius: '100px', fontSize: '11.5px' }}>Yes</span> : '-'}
                                </td>
                              );
                            })}
                            <td style={{ padding: '10px 12px', color: 'var(--apple-text-secondary)' }}></td>
                            <td style={{ padding: '10px 12px', color: 'var(--apple-text-secondary)' }}>{brand.owner}</td>
                          </tr>
                        ))}
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
        .apple-label { display: block; font-size: 13px; font-weight: 500; margin-bottom: 8px; color: var(--apple-gray-1); }
        .provider-checkbox-label:hover {
          background-color: var(--apple-gray-5) !important;
        }
        .report-row:hover {
          background-color: var(--apple-gray-5);
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .spin {
          animation: spin 1s linear infinite;
        }
      `}} />
    </div>
  );
}
