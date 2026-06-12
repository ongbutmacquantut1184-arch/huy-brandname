"use client";

import { useEffect, useState, useRef, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Save, AlertCircle, Info, CheckCircle, X, RefreshCw } from 'lucide-react';

function NhapHuyForm() {
  const [lookups, setLookups] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams.get('editId');

  // Form States
  const [userId, setUserId] = useState('');
  const [month, setMonth] = useState(new Date().toISOString().slice(0, 7));
  const [enterDate, setEnterDate] = useState(new Date().toISOString().slice(0, 10));
  
  // Brand, CP Strings (can be free text)
  const [brandSearch, setBrandSearch] = useState('');
  const [cpSearch, setCpSearch] = useState('');

  // Selected object tracking (if matches exact lookup)
  const [selectedBrand, setSelectedBrand] = useState<any>(null);
  const [selectedCp, setSelectedCp] = useState<any>(null);
  
  // Operator & Provider States
  const [selectedOperators, setSelectedOperators] = useState<string[]>([]);
  const [selectedProviders, setSelectedProviders] = useState<Record<string, string[]>>({});
  
  const [note, setNote] = useState('');

  // UI States
  const [errors, setErrors] = useState<string[]>([]);
  const [successMsg, setSuccessMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [updatedAt, setUpdatedAt] = useState('');

  // Dropdown States
  const [activeDropdown, setActiveDropdown] = useState<'brand' | 'cp' | null>(null);

  // Overlap State
  const [overlapProviders, setOverlapProviders] = useState<Record<string, string>>({});



  // Ref to handle click outside dropdowns
  const brandContainerRef = useRef<HTMLDivElement>(null);
  const cpContainerRef = useRef<HTMLDivElement>(null);

  // Click outside detection for dropdowns
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (activeDropdown === 'brand' && brandContainerRef.current && !brandContainerRef.current.contains(event.target as Node)) {
        setActiveDropdown(null);
      }
      if (activeDropdown === 'cp' && cpContainerRef.current && !cpContainerRef.current.contains(event.target as Node)) {
        setActiveDropdown(null);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [activeDropdown]);

  // Fetch Lookups
  useEffect(() => {
    fetch('/api/lookup')
      .then(r => r.json())
      .then(data => {
        setLookups(data);
        setLoading(false);
      });
  }, []);

  const handleRefreshLookups = () => {
    setLoading(true);
    fetch('/api/lookup')
      .then(r => r.json())
      .then(data => {
        setLookups(data);
        setLoading(false);
      });
  };

  // Sync selected objects based on typed text
  useEffect(() => {
    if (!lookups) return;
    const b = lookups.brands.find((x: any) => x.name.trim() === brandSearch.trim());
    setSelectedBrand(b || null);
    if (b) {
      if (!cpSearch && b.cp_id) {
        const cp = lookups.cps.find((c: any) => c.id === b.cp_id);
        if (cp) { setCpSearch(cp.name); setSelectedCp(cp); }
      }
    }
  }, [brandSearch, lookups]);

  useEffect(() => {
    if (!lookups) return;
    const c = lookups.cps.find((x: any) => x.name.trim() === cpSearch.trim());
    setSelectedCp(c || null);
  }, [cpSearch, lookups]);

  // Fetch Overlap Providers
  useEffect(() => {
    if (!month || !selectedBrand) {
      setOverlapProviders({});
      return;
    }
    
    // Only fetch if Brand is known (has ID). If new brand, it won't have overlaps.
    if (!selectedBrand.id) return;
    
    const cpIdStr = selectedCp ? selectedCp.id : '';
    const excludeIdStr = isEditMode && editId ? editId : '';
    
    fetch(`/api/cancellations/overlap?month=${month}&brand_id=${selectedBrand.id}&cp_id=${cpIdStr}&exclude_id=${excludeIdStr}`)
      .then(r => r.json())
      .then(data => {
        if (!Array.isArray(data)) return;
        const map: Record<string, string> = {};
        data.forEach((item: any) => {
          map[item.provider_id] = item.cancellation_id;
        });
        setOverlapProviders(map);
      })
      .catch(err => console.error("Error fetching overlaps:", err));
  }, [month, selectedBrand, selectedCp, isEditMode, editId]);

  // Load record detail if in Edit Mode
  useEffect(() => {
    if (!editId || !lookups) {
      setIsEditMode(false);
      return;
    }

    setLoading(true);
    fetch(`/api/cancellations?id=${editId}`)
      .then(res => {
        if (!res.ok) throw new Error('Không thể tải chi tiết phiếu hủy');
        return res.json();
      })
      .then(data => {
        setUserId(data.user_id || '');
        setMonth(data.month || '');
        setEnterDate(data.enter_date || '');
        setNote(data.note || '');
        setUpdatedAt(data.updated_at || '');
        
        const brand = data.brand;
        if (brand) {
          setBrandSearch(brand.name);
          setSelectedBrand(brand);
        }
        const cp = data.cp;
        if (cp) {
          setCpSearch(cp.name);
          setSelectedCp(cp);
        }

        const opIds: string[] = [];
        const provMap: Record<string, string[]> = {};
        
        data.details?.forEach((d: any) => {
          if (!opIds.includes(d.operator_id)) {
            opIds.push(d.operator_id);
          }
          if (!provMap[d.operator_id]) {
            provMap[d.operator_id] = [];
          }
          provMap[d.operator_id].push(d.provider_id);
        });

        setSelectedOperators(opIds);
        setSelectedProviders(provMap);
        setIsEditMode(true);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        alert(err.message);
        router.push('/nhap-huy');
        setLoading(false);
      });
  }, [editId, lookups, router]);

  const handleOperatorToggle = (opId: string) => {
    setSelectedOperators(prev => {
      if (prev.includes(opId)) {
        const newProviders = { ...selectedProviders };
        delete newProviders[opId];
        setSelectedProviders(newProviders);
        return prev.filter(id => id !== opId);
      } else {
        // Mặc định KHÔNG tick chọn nhà cung cấp nào khi chọn Nhà mạng
        setSelectedProviders(curr => ({ ...curr, [opId]: [] }));
        return [...prev, opId];
      }
    });
  };

  const handleProviderToggle = (opId: string, provId: string) => {
    if (overlapProviders[provId]) return; // Cannot toggle if already cancelled
    setSelectedProviders(prev => {
      const current = prev[opId] || [];
      if (current.includes(provId)) {
        return { ...prev, [opId]: current.filter(id => id !== provId) };
      } else {
        return { ...prev, [opId]: [...current, provId] };
      }
    });
  };

  const validateForm = () => {
    const errs = [];
    if (!userId) errs.push('Vui lòng chọn Người Nhập.');
    if (!month) errs.push('Vui lòng chọn Tháng Hủy.');
    if (!enterDate) errs.push('Vui lòng chọn Ngày nhập thông tin hủy.');
    
    if (!brandSearch.trim()) errs.push('Vui lòng nhập Brandname.');
    if (!cpSearch.trim()) errs.push('Vui lòng nhập CP_Name.');

    if (selectedOperators.length === 0) errs.push('Vui lòng chọn ít nhất 1 Nhà mạng & Nhà cung cấp.');
    for (const opId of selectedOperators) {
      if (!selectedProviders[opId] || selectedProviders[opId].length === 0) {
        const opName = lookups.opMap[opId] || opId;
        errs.push(`Vui lòng chọn ít nhất 1 Nhà cung cấp cho nhà mạng ${opName}.`);
      }
    }
    
    setErrors(errs);
    return errs.length === 0;
  };



  const handleCancelEdit = () => {
    setBrandSearch('');
    setCpSearch('');
    setSelectedBrand(null);
    setSelectedCp(null);
    setSelectedOperators([]);
    setSelectedProviders({});
    setNote('');
    setErrors([]);
    setIsEditMode(false);
    router.push('/nhap-huy');
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    
    setIsSubmitting(true);
    setErrors([]);
    setSuccessMsg('');

    let finalBrandId = selectedBrand?.id;
    if (!finalBrandId && brandSearch.trim()) {
      try {
        const res = await fetch('/api/master-data', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ type: 'brand', name: brandSearch.trim() })
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Lỗi tự động thêm mới Brandname');
        finalBrandId = data.id;
        
        // Auto update local lookup state
        setLookups((prev: any) => ({ ...prev, brands: [...prev.brands, data] }));
      } catch (err: any) {
        setErrors([err.message]);
        setIsSubmitting(false);
        window.scrollTo({ top: 0, behavior: 'smooth' });
        return;
      }
    }

    let finalCpId = selectedCp?.id;
    if (!finalCpId && cpSearch.trim()) {
      try {
        const res = await fetch('/api/master-data', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ type: 'cp', name: cpSearch.trim() })
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Lỗi tự động thêm mới CP');
        finalCpId = data.id;
        
        // Auto update local lookup state
        setLookups((prev: any) => ({ ...prev, cps: [...prev.cps, data] }));
      } catch (err: any) {
        setErrors([err.message]);
        setIsSubmitting(false);
        window.scrollTo({ top: 0, behavior: 'smooth' });
        return;
      }
    }

    const payload = {
      id: editId,
      month,
      user_id: userId,
      brand_id: finalBrandId,
      cp_id: finalCpId || null,
      note: note.trim(),
      updated_at: updatedAt,
      details: selectedOperators.map(opId => ({
        operator_id: opId,
        provider_ids: selectedProviders[opId]
      }))
    };

    try {
      const res = await fetch('/api/cancellations', {
        method: isEditMode ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Lưu thất bại');

      setSuccessMsg(isEditMode ? 'Cập nhật phiếu hủy thành công!' : 'Đã lưu phiếu hủy thành công!');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      
      // Reset form
      setBrandSearch('');
      setCpSearch('');
      setSelectedBrand(null);
      setSelectedCp(null);
      setSelectedOperators([]);
      setSelectedProviders({});
      setNote('');
      setIsEditMode(false);
      
      if (editId) {
        router.push('/nhap-huy');
      }

      setTimeout(() => setSuccessMsg(''), 5000);
    } catch (err: any) {
      setErrors([err.message || 'Đã có lỗi xảy ra khi lưu dữ liệu.']);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) return <div className="p-8 text-center text-gray">Đang tải dữ liệu danh mục...</div>;

  // Filters for Custom Suggestions
  const filteredBrands = lookups?.brands
    ? lookups.brands
        .filter((b: any) => b.name.toLowerCase().includes(brandSearch.trim().toLowerCase()))
        .slice(0, 15)
    : [];

  const filteredCps = lookups?.cps
    ? lookups.cps
        .filter((c: any) => c.name.toLowerCase().includes(cpSearch.trim().toLowerCase()))
        .slice(0, 15)
    : [];

  const filteredOwners = lookups?.owners
    ? lookups.owners
        .filter((o: any) => o.name.toLowerCase().includes(ownerSearch.trim().toLowerCase()))
        .slice(0, 15)
    : [];

  return (
    <div className="animate-fade-in" style={{ display: 'flex', gap: '24px', alignItems: 'flex-start' }}>
      
      {/* Left: Form Panel (58%) */}
      <div className="apple-card p-6" style={{ flex: '0 0 58%', position: 'relative' }}>
        <h2 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--apple-gray-4)', paddingBottom: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>{isEditMode ? `✏️ Chỉnh sửa phiếu hủy (${editId})` : 'Thông tin hủy Brandname'}</span>
            <button onClick={handleRefreshLookups} title="Tải lại danh mục mới nhất" style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--apple-gray-1)', display: 'flex', alignItems: 'center', padding: '4px', borderRadius: '4px' }} className="hover-bg-gray">
              <RefreshCw size={16} />
            </button>
          </div>
          {isEditMode && (
            <span style={{ fontSize: '12px', background: 'rgba(0,122,255,0.1)', color: 'var(--apple-blue)', padding: '4px 10px', borderRadius: '100px', fontWeight: 500 }}>
              Edit Mode
            </span>
          )}
        </h2>
        
        {errors.length > 0 && (
          <div style={{ background: 'rgba(255, 59, 48, 0.1)', border: '1px solid rgba(255, 59, 48, 0.3)', borderRadius: '12px', padding: '16px', marginBottom: '24px' }}>
            <h4 style={{ color: 'var(--apple-red)', margin: '0 0 8px 0', fontSize: '14px', fontWeight: 600 }}>Vui lòng kiểm tra lại:</h4>
            <ul style={{ margin: 0, paddingLeft: '20px', color: 'var(--apple-red)', fontSize: '13px' }}>
              {errors.map((e, i) => <li key={i}>{e}</li>)}
            </ul>
          </div>
        )}

        {successMsg && (
          <div className="animate-fade-in" style={{ background: 'rgba(52, 199, 89, 0.1)', border: '1px solid rgba(52, 199, 89, 0.3)', borderRadius: '12px', padding: '16px', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--apple-green)', fontSize: '14px', fontWeight: 500 }}>
            <CheckCircle size={18} /> {successMsg}
          </div>
        )}

        <div style={{ marginBottom: '20px' }}>
          <label className="apple-label">Người nhập hủy <span className="text-apple-red">*</span></label>
          <select className="apple-input" value={userId} onChange={e => setUserId(e.target.value)}>
            <option value="">-- Chọn người nhập --</option>
            {lookups?.users?.map((u: any) => (
              <option key={u.id} value={u.id}>{u.name}</option>
            ))}
          </select>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
          <div>
            <label className="apple-label">Tháng hủy <span className="text-apple-red">*</span></label>
            <input type="month" className="apple-input" value={month} onChange={e => setMonth(e.target.value)} />
          </div>
          <div>
            <label className="apple-label">Ngày nhập thông tin hủy <span className="text-apple-red">*</span></label>
            <input type="date" className="apple-input" value={enterDate} onChange={e => setEnterDate(e.target.value)} />
          </div>
        </div>

        {/* Brandname Input */}
        <div style={{ marginBottom: '20px', position: 'relative' }} ref={brandContainerRef}>
          <label className="apple-label">Brandname <span className="text-apple-red">*</span></label>
          <div style={{ display: 'flex', gap: '10px' }}>
            <div style={{ flex: 1, position: 'relative' }}>
              <input 
                type="text" 
                className="apple-input" 
                placeholder="Nhập tên thương hiệu..." 
                value={brandSearch}
                onChange={e => {
                  setBrandSearch(e.target.value);
                  setActiveDropdown('brand');
                }}
                onFocus={() => setActiveDropdown('brand')}
              />
              {/* Custom suggestions list */}
              {activeDropdown === 'brand' && brandSearch && filteredBrands.length > 0 && (
                <div className="custom-dropdown">
                  {filteredBrands.map((b: any) => (
                    <div 
                      key={b.id} 
                      className="dropdown-item"
                      onClick={() => {
                        setBrandSearch(b.name);
                        setSelectedBrand(b);
                        setActiveDropdown(null);
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

        {/* CP Name Input */}
        <div style={{ marginBottom: '20px', position: 'relative' }} ref={cpContainerRef}>
          <label className="apple-label">CP_Name <span className="text-apple-red">*</span></label>
          <div style={{ display: 'flex', gap: '10px' }}>
            <div style={{ flex: 1, position: 'relative' }}>
              <input 
                type="text" 
                className="apple-input" 
                placeholder="Nhập tên CP..." 
                value={cpSearch}
                onChange={e => {
                  setCpSearch(e.target.value);
                  setActiveDropdown('cp');
                }}
                onFocus={() => setActiveDropdown('cp')}
              />
              {/* Custom suggestions list */}
              {activeDropdown === 'cp' && cpSearch && filteredCps.length > 0 && (
                <div className="custom-dropdown">
                  {filteredCps.map((c: any) => (
                    <div 
                      key={c.id} 
                      className="dropdown-item"
                      onClick={() => {
                        setCpSearch(c.name);
                        setSelectedCp(c);
                        setActiveDropdown(null);
                      }}
                    >
                      {c.name}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Operators & Providers Checkboxes */}
        <div style={{ marginBottom: '20px' }}>
          <label className="apple-label">Nhà mạng & Nhà cung cấp <span className="text-apple-red">*</span></label>
          <div style={{ border: '1px solid var(--apple-gray-4)', borderRadius: '8px', overflow: 'hidden' }}>
            {lookups?.operatorProviderMapping?.map((mapping: any) => {
              const opId = mapping.id;
              const isOpChecked = selectedOperators.includes(opId);
              const providers = mapping.providers || [];
              const selectedProvs = selectedProviders[opId] || [];

              return (
                <div key={opId} style={{ borderBottom: '1px solid var(--apple-gray-4)', background: isOpChecked ? 'rgba(0,122,255,0.03)' : 'transparent', transition: 'background 0.2s' }}>
                  <div style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', cursor: 'pointer' }} onClick={() => handleOperatorToggle(opId)}>
                    <input 
                      type="checkbox" 
                      checked={isOpChecked} 
                      readOnly 
                      style={{ accentColor: 'var(--apple-blue)', transform: 'scale(1.2)', marginRight: '12px', cursor: 'pointer' }} 
                    />
                    <span style={{ fontSize: '14px', fontWeight: isOpChecked ? 600 : 500, color: isOpChecked ? 'var(--apple-blue)' : 'var(--apple-black)' }}>
                      {mapping.name}
                    </span>
                  </div>
                  
                  {isOpChecked && (
                    <div style={{ padding: '0 16px 16px 44px', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '8px' }}>
                      {providers.length === 0 ? (
                        <span style={{ fontSize: '13px', color: 'var(--apple-gray-1)', fontStyle: 'italic', gridColumn: '1/-1' }}>Không có cấu hình nhà cung cấp.</span>
                      ) : (
                        providers.map((p: any) => {
                          const isProvChecked = selectedProvs.includes(p.id);
                          const overlapId = overlapProviders[p.id];
                          const isDisabled = !!overlapId;

                          return (
                            <label key={p.id} style={{
                              display: 'inline-flex', alignItems: 'center', gap: '6px',
                              padding: '6px 12px', borderRadius: '100px',
                              border: `1px solid ${isDisabled ? 'var(--apple-gray-3)' : isProvChecked ? 'var(--apple-blue)' : 'var(--apple-gray-3)'}`,
                              background: isDisabled ? 'var(--apple-gray-5)' : isProvChecked ? 'rgba(0,122,255,0.08)' : 'var(--apple-white)',
                              color: isDisabled ? 'var(--apple-gray-2)' : isProvChecked ? 'var(--apple-blue)' : 'var(--apple-text-secondary)',
                              cursor: isDisabled ? 'not-allowed' : 'pointer', fontSize: '13px', transition: 'all 0.2s',
                              whiteSpace: 'normal',
                              wordBreak: 'break-word',
                              textAlign: 'left',
                              justifyContent: 'flex-start',
                              opacity: isDisabled ? 0.7 : 1
                            }}>
                              <input 
                                type="checkbox" 
                                checked={isProvChecked}
                                disabled={isDisabled}
                                onChange={(e) => { e.stopPropagation(); handleProviderToggle(opId, p.id); }}
                                style={{ display: 'none' }}
                              />
                              {isProvChecked && !isDisabled && <CheckCircle size={14} style={{ flexShrink: 0 }} />}
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                <span style={{ fontWeight: isProvChecked && !isDisabled ? 500 : 400 }}>{p.name}</span>
                                {overlapId && (
                                  <span style={{ fontSize: '11px', color: 'var(--apple-red)', fontStyle: 'italic' }}>
                                    (Trùng phiếu {overlapId})
                                  </span>
                                )}
                              </div>
                            </label>
                          );
                        })
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div style={{ marginBottom: '24px' }}>
          <label className="apple-label">Ghi chú</label>
          <textarea className="apple-input" rows={2} placeholder="Thông tin bổ sung..." value={note} onChange={e => setNote(e.target.value)}></textarea>
        </div>

        <div style={{ display: 'flex', gap: '12px' }}>
          <button className="apple-btn apple-btn-primary" onClick={handleSubmit} disabled={isSubmitting}>
            <Save size={16} /> {isSubmitting ? 'Đang xử lý...' : isEditMode ? 'Cập Nhật Thông Tin Hủy' : 'Lưu Thông Tin Hủy'}
          </button>
          
          {isEditMode && (
            <button className="apple-btn" style={{ background: 'var(--apple-gray-4)', color: 'var(--apple-black)' }} onClick={handleCancelEdit}>
              Hủy chỉnh sửa
            </button>
          )}
        </div>
      </div>

      {/* Right: Preview Panel (42%) */}
      <div style={{ flex: '0 0 42%', position: 'sticky', top: '24px' }}>
        <div className="apple-card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '16px 20px', background: 'var(--apple-gray-4)', borderBottom: '1px solid var(--apple-gray-3)' }}>
            <h3 style={{ fontSize: '15px', fontWeight: 600, margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
              Bản xem trước dữ liệu
            </h3>
          </div>
          
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
            <thead>
              <tr>
                <th style={{ textAlign: 'left', padding: '10px 16px', background: 'var(--apple-gray-5)', color: 'var(--apple-gray-1)', fontWeight: 600, borderBottom: '1px solid var(--apple-gray-4)', width: '35%' }}>Nhà mạng</th>
                <th style={{ textAlign: 'left', padding: '10px 16px', background: 'var(--apple-gray-5)', color: 'var(--apple-gray-1)', fontWeight: 600, borderBottom: '1px solid var(--apple-gray-4)' }}>Nhà cung cấp đã chọn</th>
              </tr>
            </thead>
            <tbody>
              {selectedOperators.length === 0 ? (
                <tr>
                  <td colSpan={2} style={{ textAlign: 'center', padding: '32px 16px', color: 'var(--apple-gray-1)' }}>
                    Chưa có nhà mạng nào được chọn
                  </td>
                </tr>
              ) : (
                selectedOperators.map(opId => {
                  const opName = lookups.opMap[opId] || opId;
                  const selectedForOp = selectedProviders[opId] || [];
                  const providerNames = selectedForOp.map(pid => lookups.provMap[pid] || pid);

                  return (
                    <tr key={opId} style={{ borderBottom: '1px solid var(--apple-gray-4)' }}>
                      <td style={{ padding: '12px 16px', verticalAlign: 'top', fontWeight: 600, color: 'var(--apple-black)' }}>{opName}</td>
                      <td style={{ padding: '12px 16px', display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                        {selectedForOp.length === 0 ? (
                          <span style={{ color: 'var(--apple-gray-1)' }}>--</span>
                        ) : (
                          selectedForOp.map(pid => {
                            const pname = lookups.provMap[pid] || pid;
                            return (
                              <span key={pid} style={{
                                fontSize: '12px',
                                background: '#f2f2f7',
                                color: 'var(--apple-blue)',
                                padding: '4px 10px',
                                borderRadius: '100px',
                                fontWeight: 500,
                                display: 'inline-block'
                              }}>
                                {pname}
                              </span>
                            );
                          })
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>


      
      <style dangerouslySetInnerHTML={{__html: `
        .border-red { border-color: var(--apple-red) !important; background-color: rgba(255, 59, 48, 0.05) !important; }
        .text-apple-red { color: var(--apple-red); }
        .apple-label { display: block; font-size: 13px; font-weight: 500; margin-bottom: 8px; color: var(--apple-gray-1); }
        
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
        }
        .dropdown-item:last-child {
          border-bottom: none;
        }
        .dropdown-item:hover {
          background-color: rgba(0, 122, 255, 0.06);
          color: var(--apple-blue);
          font-weight: 500;
        }

        /* Tiny add button next to input */
        .add-btn-small {
          padding: 0 12px;
          font-size: 12px;
          white-space: nowrap;
          border: 1px solid var(--apple-blue);
          color: var(--apple-blue);
          background: transparent;
          font-weight: 500;
          border-radius: 8px;
          transition: all 0.2s;
        }
        .add-btn-small:hover {
          background: rgba(0, 122, 255, 0.05);
        }

        /* Warning styles inside form */
        .alert-inside-form {
          margin-top: 8px;
          padding: 8px 12px;
          background: rgba(255, 159, 10, 0.06);
          border: 1px solid rgba(255, 159, 10, 0.25);
          border-radius: 8px;
          font-size: 12.5px;
          color: #8f5800;
          display: flex;
          align-items: center;
        }
        .btn-link-inline {
          background: none;
          border: none;
          color: var(--apple-blue);
          text-decoration: underline;
          cursor: pointer;
          padding: 0 4px;
          font-weight: 600;
          font-size: 12.5px;
        }
        .btn-link-inline:hover {
          color: #0056b3;
        }

        /* Scale Up animations */
        @keyframes scaleUp {
          from { transform: scale(0.96); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
        .animate-scale-up {
          animation: scaleUp 0.12s ease-out forwards;
        }
      `}} />
    </div>
  );
}

export default function NhapHuyPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-gray">Đang tải form Nhập Hủy...</div>}>
      <NhapHuyForm />
    </Suspense>
  );
}
