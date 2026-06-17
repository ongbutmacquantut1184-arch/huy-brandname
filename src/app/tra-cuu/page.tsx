"use client";

import React, { useEffect, useState, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Search as SearchIcon, Filter, Clock, FileText, ChevronDown, ChevronUp } from 'lucide-react';

const formatMonth = (m: string) => {
  if (!m) return '';
  const parts = m.split('-');
  return parts.length === 2 ? `${parts[1]}/${parts[0]}` : m;
};

const formatDate = (dateStr: string) => {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const yyyy = d.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
};

function TraCuuContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const idParam = searchParams.get('id');
  
  const [lookups, setLookups] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Filter States
  const [keyword, setKeyword] = useState('');
  const [month, setMonth] = useState('');
  const [userId, setUserId] = useState('');
  const [selectedOperators, setSelectedOperators] = useState<string[]>([]);

  // Suggestion UI States
  const [showSuggestions, setShowSuggestions] = useState(false);
  const keywordContainerRef = useRef<HTMLDivElement>(null);

  // Click outside detection for keyword suggestions
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (keywordContainerRef.current && !keywordContainerRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Result States
  const [results, setResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  
  // Expanded rows
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/lookup')
      .then(r => r.json())
      .then(data => {
        setLookups(data);
        setLoading(false);
      });
  }, []);

  const handleOperatorToggle = (opId: string) => {
    setSelectedOperators(prev => 
      prev.includes(opId) ? prev.filter(id => id !== opId) : [...prev, opId]
    );
  };

  const handleSearch = async (overrideKeyword?: string) => {
    setIsSearching(true);
    setHasSearched(true);
    setExpandedId(null);

    const kw = overrideKeyword !== undefined ? overrideKeyword : keyword;

    const params = new URLSearchParams();
    if (kw) params.append('keyword', kw);
    if (month) params.append('month', month);
    if (userId) params.append('user', userId);
    if (selectedOperators.length > 0) params.append('operators', selectedOperators.join(','));

    try {
      const res = await fetch('/api/search?' + params.toString());
      const data = await res.json();
      setResults(data);
    } catch (err) {
      console.error(err);
      setResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  useEffect(() => {
    if (lookups && idParam && !hasSearched && !isSearching) {
      setKeyword(idParam);
      
      const params = new URLSearchParams();
      params.append('keyword', idParam);
      
      setIsSearching(true);
      setHasSearched(true);
      setExpandedId(null);
      
      fetch('/api/search?' + params.toString())
        .then(res => res.json())
        .then(data => {
          setResults(data);
          if (data && data.length > 0) {
            setExpandedId(data[0].id);
          }
        })
        .catch(err => {
          console.error(err);
          setResults([]);
        })
        .finally(() => {
          setIsSearching(false);
        });
    }
  }, [lookups, idParam, hasSearched, isSearching]);

  if (loading) return <div className="p-8 text-center text-gray">Đang tải dữ liệu danh mục...</div>;

  // Filters for keyword suggestions
  const filteredBrands = lookups?.brands
    ? lookups.brands
        .filter((b: any) => b.name.toLowerCase().includes(keyword.toLowerCase()))
        .slice(0, 15)
    : [];

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* Top Bar: Filters */}
      <div className="card-container p-6" style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', alignItems: 'flex-end', zIndex: 10, overflow: 'visible', boxShadow: 'var(--shadow-md)' }}>
        <div style={{ flex: '1 1 200px', zIndex: 50 }}>
          <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '8px', color: 'var(--neutral-700)' }}>
            <Filter size={14} style={{ display: 'inline', marginBottom: '-2px', marginRight: '4px', color: 'var(--primary-600)' }}/> Từ khóa
          </label>
          <div style={{ position: 'relative', zIndex: 50 }} ref={keywordContainerRef}>
            <SearchIcon size={16} style={{ position: 'absolute', left: '12px', top: '13px', color: 'var(--neutral-400)', zIndex: 5 }} />
            <input 
              type="text" 
              className="input-field" 
              placeholder="Brandname, Ghi chú..." 
              style={{ paddingLeft: '36px' }} 
              value={keyword}
              onChange={e => {
                setKeyword(e.target.value);
                setShowSuggestions(true);
              }}
              onFocus={() => setShowSuggestions(true)}
              onKeyDown={e => e.key === 'Enter' && (setShowSuggestions(false), handleSearch())}
            />
            
            {/* Suggestions list */}
            {showSuggestions && keyword && filteredBrands.length > 0 && (
              <div className="custom-dropdown">
                {filteredBrands.map((b: any) => (
                  <div 
                    key={b.id} 
                    className="dropdown-item"
                    onClick={() => {
                      setKeyword(b.name);
                      setShowSuggestions(false);
                      handleSearch(b.name);
                    }}
                  >
                    {b.name}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div style={{ width: '150px' }}>
          <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '8px', color: 'var(--neutral-700)' }}>Tháng</label>
          <input type="month" className="input-field" value={month} onChange={e => setMonth(e.target.value)} />
        </div>

        <div style={{ width: '180px' }}>
          <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '8px', color: 'var(--neutral-700)' }}>Người nhập</label>
          <select className="input-field" value={userId} onChange={e => setUserId(e.target.value)}>
            <option value="">-- Tất cả --</option>
            {lookups?.users?.map((u: any) => (
              <option key={u.id} value={u.id}>{u.name}</option>
            ))}
          </select>
        </div>

        <div style={{ flex: '2 1 300px' }}>
          <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '8px', color: 'var(--neutral-700)' }}>Nhà mạng</label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {lookups?.operators?.map((op: any) => {
              const isChecked = selectedOperators.includes(op.id);
              return (
                <label key={op.id} style={{ 
                  display: 'inline-flex', 
                  alignItems: 'center', 
                  gap: '6px', 
                  cursor: 'pointer', 
                  padding: '8px 16px', 
                  borderRadius: 'var(--radius-full)', 
                  border: isChecked ? '1px solid var(--primary-500)' : '1px solid var(--neutral-300)', 
                  background: isChecked ? 'var(--primary-50)' : '#FFFFFF', 
                  transition: 'var(--transition-fast)',
                  fontWeight: isChecked ? 600 : 500,
                  boxShadow: isChecked ? '0 1px 2px rgba(0, 122, 255, 0.05)' : 'none'
                }}>
                  <input type="checkbox" checked={isChecked} onChange={() => handleOperatorToggle(op.id)} style={{ display: 'none' }} />
                  {isChecked && <CheckCircle size={14} style={{ color: 'var(--primary-600)' }} />}
                  <span style={{ fontSize: '13px', color: isChecked ? 'var(--primary-700)' : 'var(--neutral-700)' }}>{op.name}</span>
                </label>
              );
            })}
          </div>
        </div>

        <button className="btn btn-primary" style={{ padding: '0 24px', height: '42px', flexShrink: 0 }} onClick={() => handleSearch()} disabled={isSearching}>
          {isSearching ? 'Đang tìm...' : 'Tìm Kiếm'}
        </button>
      </div>

      {/* Right Content: Results */}
      <div className="card-container" style={{ overflow: 'hidden', boxShadow: 'var(--shadow-md)' }}>
        <div style={{ padding: '18px 24px', borderBottom: '1.5px solid var(--neutral-200)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--neutral-100)' }}>
          <h2 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--neutral-900)', margin: 0 }}>Kết quả Tra Cứu</h2>
          {hasSearched && (
            <span className="badge-custom badge-primary" style={{ padding: '6px 12px', fontSize: '12px' }}>
              {results.length} bản ghi
            </span>
          )}
        </div>
        
        {!hasSearched ? (
          <div style={{ padding: '80px 40px', textAlign: 'center', color: 'var(--neutral-500)' }}>
            <SearchIcon size={48} style={{ margin: '0 auto 16px auto', opacity: 0.4, color: 'var(--primary-400)' }} />
            <p style={{ fontSize: '15px', margin: 0, fontWeight: 500 }}>Hãy chọn bộ lọc và bấm <strong>Tìm kiếm</strong> để xem kết quả.</p>
          </div>
        ) : results.length === 0 ? (
          <div style={{ padding: '80px 40px', textAlign: 'center', color: 'var(--neutral-500)' }}>
            <FileText size={48} style={{ margin: '0 auto 16px auto', opacity: 0.4, color: 'var(--neutral-400)' }} />
            <p style={{ fontSize: '15px', margin: 0, fontWeight: 500 }}>Không tìm thấy bản ghi nào khớp với điều kiện lọc.</p>
          </div>
        ) : (
          <div style={{ maxHeight: 'calc(100vh - 220px)', overflowY: 'auto' }}>
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Brandname</th>
                  <th>CP_Name</th>
                  <th>Tháng hủy</th>
                  <th>Hủy bao nhiêu NCC</th>
                  <th>Người nhập hủy</th>
                  <th>Ngày nhập hủy</th>
                  <th>Ghi chú</th>
                  <th style={{ width: '50px' }}></th>
                </tr>
              </thead>
              <tbody>
                {results.map((item: any) => {
                  const isExpanded = expandedId === item.id;
                  return (
                    <React.Fragment key={item.id}>
                      <tr 
                        style={{ cursor: 'pointer', background: isExpanded ? 'var(--primary-50)' : '#FFFFFF' }}
                        onClick={() => setExpandedId(isExpanded ? null : item.id)}
                      >
                        <td style={{ fontWeight: 700, color: 'var(--primary-700)' }}>
                          {item.brand?.name || '--'}
                        </td>
                        <td style={{ color: 'var(--neutral-900)', fontWeight: 500 }}>
                          {item.cp?.name || '--'}
                        </td>
                        <td>{formatMonth(item.month)}</td>
                        <td style={{ color: 'var(--neutral-900)', fontWeight: 600 }}>
                          {item.details?.length || 0} NCC
                        </td>
                        <td style={{ color: 'var(--neutral-600)' }}>{item.user?.name || '--'}</td>
                        <td style={{ color: 'var(--neutral-600)' }}>{formatDate(item.enter_date)}</td>
                        <td>
                          {item.note ? (
                            <span className="badge-custom badge-warning" style={{ padding: '2px 8px', fontSize: '11px' }}>Có ghi chú</span>
                          ) : (
                            <span style={{ color: 'var(--neutral-400)' }}>--</span>
                          )}
                        </td>
                        <td style={{ textAlign: 'center', color: 'var(--neutral-500)' }}>
                          {isExpanded ? <ChevronUp size={18} style={{ color: 'var(--primary-600)' }} /> : <ChevronDown size={18} />}
                        </td>
                      </tr>
                      {/* Expanded Details Row */}
                      {isExpanded && (
                        <tr style={{ background: 'var(--neutral-50)' }}>
                          <td colSpan={8} style={{ padding: '24px', borderBottom: '1px solid var(--neutral-200)' }}>
                            <div className="card-container animate-fade-in" style={{ background: '#FFFFFF', padding: '20px', boxShadow: 'var(--shadow-sm)' }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                                <h4 style={{ fontSize: '14px', fontWeight: 700, margin: 0, color: 'var(--neutral-900)' }}>Chi tiết các nhà cung cấp đã hủy:</h4>
                                <button 
                                  className="btn btn-secondary" 
                                  style={{ padding: '6px 14px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}
                                  onClick={(e) => { e.stopPropagation(); router.push('/nhap-huy?editId=' + item.id); }}
                                >
                                  ✏️ Chỉnh sửa phiếu
                                </button>
                              </div>
                              {item.note && (
                                <div style={{ marginBottom: '20px', padding: '14px 16px', background: 'var(--gold-50)', borderLeft: '4px solid var(--gold-500)', borderRadius: '0 var(--radius-md) var(--radius-md) 0', fontSize: '13.5px', boxShadow: 'var(--shadow-xs)' }}>
                                  <strong style={{ color: 'var(--gold-700)', display: 'block', marginBottom: '4px' }}>Ghi chú từ người nhập:</strong>
                                  <span style={{ color: 'var(--neutral-800)', whiteSpace: 'pre-wrap' }}>{item.note}</span>
                                </div>
                              )}
                              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
                                {(() => {
                                  const grouped: Record<string, { name: string; providers: string[] }> = {};
                                  item.details?.forEach((d: any) => {
                                    const opId = d.operator?.id || d.operator_id;
                                    const opName = d.operator?.name || opId;
                                    const provName = d.provider?.name || d.provider_id;
                                    if (opId) {
                                      if (!grouped[opId]) {
                                        grouped[opId] = { name: opName, providers: [] };
                                      }
                                      if (provName && !grouped[opId].providers.includes(provName)) {
                                        grouped[opId].providers.push(provName);
                                      }
                                    }
                                  });

                                  return Object.values(grouped).map((group: any, idx: number) => (
                                    <div key={idx} style={{ padding: '14px', border: '1px solid var(--neutral-200)', borderRadius: 'var(--radius-md)', background: 'var(--neutral-50)' }}>
                                      <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--neutral-900)', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                        <div style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: 'var(--primary-600)' }}></div>
                                        {group.name}
                                      </div>
                                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                                        {group.providers.length === 0 ? (
                                          <span style={{ fontSize: '12.5px', color: 'var(--neutral-400)', fontStyle: 'italic' }}>Không có nhà cung cấp</span>
                                        ) : (
                                          group.providers.map((pname: string, pIdx: number) => (
                                            <span key={pIdx} className="badge-custom badge-primary" style={{ padding: '4px 10px', fontSize: '12px' }}>{pname}</span>
                                          ))
                                        )}
                                      </div>
                                    </div>
                                  ));
                                })()}
                              </div>
                              <div style={{ marginTop: '20px', paddingOver: '12px', borderTop: '1px dashed var(--neutral-200)', paddingTop: '12px', fontSize: '12px', color: 'var(--neutral-400)', display: 'flex', justifyContent: 'space-between' }}>
                                <span>Mã phiếu: <strong>{item.id}</strong></span>
                                <span>Ngày nhập hệ thống: {formatDate(item.enter_date)}</span>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
      
      <style dangerouslySetInnerHTML={{__html: `
        /* Custom dropdown style */
        .custom-dropdown {
          position: absolute;
          top: calc(100% + 4px);
          left: 0;
          right: 0;
          z-index: 50;
          background: rgba(255, 255, 255, 0.98);
          border: 1px solid var(--neutral-300);
          border-radius: var(--radius-md);
          box-shadow: var(--shadow-lg);
          max-height: 200px;
          overflow-y: auto;
          backdrop-filter: blur(8px);
        }
        .dropdown-item {
          padding: 10px 14px;
          cursor: pointer;
          font-size: 13.5px;
          color: var(--neutral-700);
          border-bottom: 1px solid var(--neutral-200);
          transition: var(--transition-fast);
          text-align: left;
        }
        .dropdown-item:last-child {
          border-bottom: none;
        }
        .dropdown-item:hover {
          background-color: var(--primary-50);
          color: var(--primary-700);
          font-weight: 600;
        }
      `}} />
    </div>
  );
}

export default function TraCuuPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-gray">Đang tải dữ liệu...</div>}>
      <TraCuuContent />
    </Suspense>
  );
}
