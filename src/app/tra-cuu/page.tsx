"use client";

import React, { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
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

export default function TraCuuPage() {
  const router = useRouter();
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
    const cached = sessionStorage.getItem('lookups_cache');
    if (cached) {
      try {
        setLookups(JSON.parse(cached));
        setLoading(false);
      } catch (e) {}
    }
    fetch('/api/lookup')
      .then(r => r.json())
      .then(data => {
        setLookups(data);
        setLoading(false);
        sessionStorage.setItem('lookups_cache', JSON.stringify(data));
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
      <div className="apple-card p-4" style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', alignItems: 'flex-end' }}>
        <div style={{ flex: '1 1 200px' }}>
          <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, marginBottom: '8px', color: 'var(--apple-gray-1)' }}>
            <Filter size={14} style={{ display: 'inline', marginBottom: '-2px', marginRight: '4px' }}/> Từ khóa
          </label>
          <div style={{ position: 'relative' }} ref={keywordContainerRef}>
            <SearchIcon size={16} style={{ position: 'absolute', left: '12px', top: '12px', color: 'var(--apple-gray-1)', zIndex: 5 }} />
            <input 
              type="text" 
              className="apple-input" 
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

        </div>

        <div style={{ width: '150px' }}>
          <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, marginBottom: '8px', color: 'var(--apple-gray-1)' }}>Tháng</label>
          <input type="month" className="apple-input" value={month} onChange={e => setMonth(e.target.value)} />
        </div>

        <div style={{ width: '180px' }}>
          <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, marginBottom: '8px', color: 'var(--apple-gray-1)' }}>Người nhập</label>
          <select className="apple-input" value={userId} onChange={e => setUserId(e.target.value)}>
            <option value="">-- Tất cả --</option>
            {lookups?.users?.map((u: any) => (
              <option key={u.id} value={u.id}>{u.name}</option>
            ))}
          </select>
        </div>

        <div style={{ flex: '2 1 300px' }}>
          <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, marginBottom: '8px', color: 'var(--apple-gray-1)' }}>Nhà mạng</label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {lookups?.operators?.map((op: any) => (
              <label key={op.id} style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', padding: '6px 12px', borderRadius: '100px', border: selectedOperators.includes(op.id) ? '1px solid var(--apple-blue)' : '1px solid var(--apple-gray-3)', background: selectedOperators.includes(op.id) ? 'rgba(0,122,255,0.08)' : 'var(--apple-white)', transition: 'var(--apple-transition)' }}>
                <input type="checkbox" checked={selectedOperators.includes(op.id)} onChange={() => handleOperatorToggle(op.id)} style={{ display: 'none' }} />
                <span style={{ fontSize: '13px', fontWeight: selectedOperators.includes(op.id) ? 500 : 400, color: selectedOperators.includes(op.id) ? 'var(--apple-blue)' : 'var(--apple-text-secondary)' }}>{op.name}</span>
              </label>
            ))}
          </div>
        </div>

        <button className="apple-btn apple-btn-primary" style={{ padding: '0 24px', height: '42px', flexShrink: 0 }} onClick={() => handleSearch()} disabled={isSearching}>
          {isSearching ? 'Đang tìm...' : 'Tìm Kiếm'}
        </button>
      </div>

      {/* Right Content: Results */}
      <div className="apple-card p-0" style={{ overflow: 'hidden' }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--apple-border-light)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--apple-gray-4)' }}>
          <h2 style={{ fontSize: '16px', fontWeight: 600, margin: 0 }}>Kết quả Tra Cứu</h2>
          {hasSearched && (
            <span style={{ fontSize: '12px', fontWeight: 600, padding: '4px 10px', borderRadius: '100px', background: 'rgba(0,122,255,0.1)', color: 'var(--apple-blue)' }}>
              {results.length} bản ghi
            </span>
          )}
        </div>
        
        {!hasSearched ? (
          <div style={{ padding: '60px 40px', textAlign: 'center', color: 'var(--apple-gray-1)' }}>
            <SearchIcon size={40} style={{ margin: '0 auto 16px auto', opacity: 0.3 }} />
            <p style={{ fontSize: '15px', margin: 0 }}>Hãy chọn bộ lọc và bấm <strong>Tìm kiếm</strong> để xem kết quả.</p>
          </div>
        ) : results.length === 0 ? (
          <div style={{ padding: '60px 40px', textAlign: 'center', color: 'var(--apple-gray-1)' }}>
            <FileText size={40} style={{ margin: '0 auto 16px auto', opacity: 0.3 }} />
            <p style={{ fontSize: '15px', margin: 0 }}>Không tìm thấy bản ghi nào khớp với điều kiện lọc.</p>
          </div>
        ) : (
          <div style={{ maxHeight: 'calc(100vh - 150px)', overflowY: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
              <thead style={{ position: 'sticky', top: 0, background: 'var(--apple-white)', zIndex: 10, boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
                <tr>
                  <th style={{ textAlign: 'left', padding: '12px 20px', fontWeight: 600, color: 'var(--apple-gray-1)', borderBottom: '1px solid var(--apple-gray-3)' }}>Brandname</th>
                  <th style={{ textAlign: 'left', padding: '12px 20px', fontWeight: 600, color: 'var(--apple-gray-1)', borderBottom: '1px solid var(--apple-gray-3)' }}>CP</th>
                  <th style={{ textAlign: 'left', padding: '12px 20px', fontWeight: 600, color: 'var(--apple-gray-1)', borderBottom: '1px solid var(--apple-gray-3)' }}>Tháng hủy</th>
                  <th style={{ textAlign: 'left', padding: '12px 20px', fontWeight: 600, color: 'var(--apple-gray-1)', borderBottom: '1px solid var(--apple-gray-3)' }}>Hủy bao nhiêu NCC</th>
                  <th style={{ textAlign: 'left', padding: '12px 20px', fontWeight: 600, color: 'var(--apple-gray-1)', borderBottom: '1px solid var(--apple-gray-3)' }}>Người nhập hủy</th>
                  <th style={{ textAlign: 'left', padding: '12px 20px', fontWeight: 600, color: 'var(--apple-gray-1)', borderBottom: '1px solid var(--apple-gray-3)' }}>Ngày nhập hủy</th>
                  <th style={{ textAlign: 'left', padding: '12px 20px', fontWeight: 600, color: 'var(--apple-gray-1)', borderBottom: '1px solid var(--apple-gray-3)' }}>Ghi chú</th>
                  <th style={{ width: '40px', borderBottom: '1px solid var(--apple-gray-3)' }}></th>
                </tr>
              </thead>
              <tbody>
                {results.map((item: any) => {
                  const isExpanded = expandedId === item.id;
                  return (
                    <React.Fragment key={item.id}>
                      <tr 
                        style={{ borderBottom: '1px solid var(--apple-gray-4)', cursor: 'pointer', background: isExpanded ? 'rgba(0,122,255,0.02)' : 'var(--apple-white)', transition: 'var(--apple-transition)' }}
                        onClick={() => setExpandedId(isExpanded ? null : item.id)}
                        className="hover-bg-gray"
                      >
                        <td style={{ padding: '14px 20px', fontWeight: 600, color: 'var(--apple-blue)' }}>
                          {item.brand?.name || '--'}
                        </td>
                        <td style={{ padding: '14px 20px', color: 'var(--apple-black)' }}>
                          {item.cp?.name || '--'}
                        </td>
                        <td style={{ padding: '14px 20px', color: 'var(--apple-gray-1)' }}>{formatMonth(item.month)}</td>
                        <td style={{ padding: '14px 20px', color: 'var(--apple-black)', fontWeight: 500 }}>
                          {item.details?.length || 0} NCC
                        </td>
                        <td style={{ padding: '14px 20px', color: 'var(--apple-gray-1)' }}>{item.user?.name || '--'}</td>
                        <td style={{ padding: '14px 20px', color: 'var(--apple-gray-1)' }}>{formatDate(item.enter_date)}</td>
                        <td style={{ padding: '14px 20px', color: item.note ? 'var(--apple-black)' : 'var(--apple-gray-1)', fontWeight: item.note ? 500 : 400 }}>
                          {item.note ? 'Có' : 'Không'}
                        </td>
                        <td style={{ padding: '14px 20px', color: 'var(--apple-gray-1)', textAlign: 'center' }}>
                          {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                        </td>
                      </tr>
                      {/* Expanded Details Row */}
                      {isExpanded && (
                        <tr style={{ background: 'rgba(0,0,0,0.01)', borderBottom: '1px solid var(--apple-gray-3)' }}>
                          <td colSpan={8} style={{ padding: '20px' }}>
                            <div style={{ background: 'var(--apple-white)', border: '1px solid var(--apple-border-light)', borderRadius: '12px', padding: '16px', boxShadow: 'var(--apple-shadow-sm)' }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                                <h4 style={{ fontSize: '14px', fontWeight: 600, margin: 0, color: 'var(--apple-black)' }}>Chi tiết Hủy:</h4>
                                <button 
                                  className="apple-btn apple-btn-primary" 
                                  style={{ padding: '6px 12px', fontSize: '12.5px', display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}
                                  onClick={() => router.push('/nhap-huy?editId=' + item.id)}
                                >
                                  ✏️ Chỉnh sửa
                                </button>
                              </div>
                              {item.note && (
                                <div style={{ marginBottom: '16px', padding: '12px', background: 'rgba(255,149,0,0.1)', borderLeft: '3px solid var(--apple-orange)', borderRadius: '0 8px 8px 0', fontSize: '13px' }}>
                                  <strong style={{ color: 'var(--apple-orange)' }}>Ghi chú: </strong>
                                  <span style={{ color: 'var(--apple-black)', whiteSpace: 'pre-wrap' }}>{item.note}</span>
                                </div>
                              )}
                              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px' }}>
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
                                    <div key={idx} style={{ padding: '12px', border: '1px solid var(--apple-gray-4)', borderRadius: '8px' }}>
                                      <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--apple-black)', marginBottom: '8px' }}>{group.name}</div>
                                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                                        {group.providers.length === 0 ? (
                                          <span style={{ fontSize: '12.5px', color: 'var(--apple-gray-1)' }}>Không có nhà cung cấp</span>
                                        ) : (
                                          group.providers.map((pname: string, pIdx: number) => (
                                            <span key={pIdx} style={{ fontSize: '12.5px', background: '#f2f2f7', color: 'var(--apple-blue)', padding: '4px 10px', borderRadius: '100px', fontWeight: 500 }}>{pname}</span>
                                          ))
                                        )}
                                      </div>
                                    </div>
                                  ));
                                })()}
                              </div>
                              <div style={{ marginTop: '16px', fontSize: '12px', color: 'var(--apple-gray-1)', display: 'flex', justifyContent: 'space-between' }}>
                                <span>Record ID: {item.id}</span>
                                <span>Ngày nhập: {formatDate(item.enter_date)}</span>
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
        .hover-bg-gray:hover { background-color: var(--apple-gray-4) !important; }
        
        /* Custom dropdown style */
        .custom-dropdown {
          position: absolute;
          top: calc(100% + 4px);
          left: 0;
          right: 0;
          z-index: 50;
          background: rgba(255, 255, 255, 0.95);
          border: 1px solid var(--apple-gray-4);
          border-radius: 10px;
          box-shadow: 0 10px 25px rgba(0,0,0,0.1);
          max-height: 200px;
          overflow-y: auto;
          backdrop-filter: blur(8px);
        }
        .dropdown-item {
          padding: 10px 14px;
          cursor: pointer;
          font-size: 13px;
          color: var(--apple-black);
          border-bottom: 1px solid var(--apple-gray-5);
          transition: background 0.15s, color 0.15s;
          text-align: left;
        }
        .dropdown-item:last-child {
          border-bottom: none;
        }
        .dropdown-item:hover {
          background-color: rgba(0, 122, 255, 0.06);
          color: var(--apple-blue);
          font-weight: 500;
        }
      `}} />
    </div>
  );
}
