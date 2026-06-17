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
      <div className="card-container p-6" style={{ flex: '0 0 58%', position: 'relative', boxShadow: 'var(--shadow-md)' }}>
        <h2 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--neutral-900)', marginBottom: '24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1.5px solid var(--neutral-200)', paddingBottom: '14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>{isEditMode ? `✏️ Chỉnh sửa phiếu hủy (${editId})` : 'Thông tin hủy Brandname'}</span>
            <button onClick={handleRefreshLookups} title="Tải lại danh mục mới nhất" style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--neutral-500)', display: 'flex', alignItems: 'center', padding: '4px', borderRadius: '4px' }} className="hover-bg-gray">
              <RefreshCw size={16} />
            </button>
          </div>
          {isEditMode && (
            <span className="badge-custom badge-primary">
              Chế độ chỉnh sửa
            </span>
          )}
        </h2>
        
        {errors.length > 0 && (
          <div style={{ background: 'var(--error-50)', border: '1px solid var(--error-100)', borderRadius: 'var(--radius-md)', padding: '16px', marginBottom: '24px' }}>
            <h4 style={{ color: 'var(--error-700)', margin: '0 0 8px 0', fontSize: '14px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
              <AlertCircle size={16} /> Vui lòng kiểm tra lại:
            </h4>
            <ul style={{ margin: 0, paddingLeft: '20px', color: 'var(--error-700)', fontSize: '13px' }}>
              {errors.map((e, i) => <li key={i}>{e}</li>)}
            </ul>
          </div>
        )}

        {successMsg && (
          <div className="animate-fade-in badge-custom badge-success" style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '16px', marginBottom: '24px', width: '100%', borderRadius: 'var(--radius-md)', fontSize: '14px' }}>
            <CheckCircle size={18} /> {successMsg}
          </div>
        )}

        <div style={{ marginBottom: '20px' }}>
          <label className="label-custom">Người nhập hủy <span className="text-error-600">*</span></label>
          <select className="input-field" value={userId} onChange={e => setUserId(e.target.value)}>
            <option value="">-- Chọn người nhập --</option>
            {lookups?.users?.map((u: any) => (
              <option key={u.id} value={u.id}>{u.name}</option>
            ))}
          </select>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
          <div>
            <label className="label-custom">Tháng hủy <span className="text-error-600">*</span></label>
            <input type="month" className="input-field" value={month} onChange={e => setMonth(e.target.value)} />
          </div>
          <div>
            <label className="label-custom">Ngày nhập thông tin hủy <span className="text-error-600">*</span></label>
            <input type="date" className="input-field" value={enterDate} onChange={e => setEnterDate(e.target.value)} />
          </div>
        </div>

        {/* Brandname Input */}
        <div style={{ marginBottom: '20px', position: 'relative' }} ref={brandContainerRef}>
          <label className="label-custom">Brandname <span className="text-error-600">*</span></label>
          <div style={{ display: 'flex', gap: '10px' }}>
            <div style={{ flex: 1, position: 'relative' }}>
              <input 
                type="text" 
                className="input-field" 
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
          <label className="label-custom">CP_Name <span className="text-error-600">*</span></label>
          <div style={{ display: 'flex', gap: '10px' }}>
            <div style={{ flex: 1, position: 'relative' }}>
              <input 
                type="text" 
                className="input-field" 
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
          <label className="label-custom">Nhà mạng & Nhà cung cấp <span className="text-error-600">*</span></label>
          <div style={{ border: '1px solid var(--neutral-200)', borderRadius: 'var(--radius-md)', overflow: 'hidden', boxShadow: 'var(--shadow-xs)' }}>
            {lookups?.operatorProviderMapping?.map((mapping: any) => {
              const opId = mapping.id;
              const isOpChecked = selectedOperators.includes(opId);
              const providers = mapping.providers || [];
              const selectedProvs = selectedProviders[opId] || [];

              return (
                <div key={opId} style={{ borderBottom: '1px solid var(--neutral-200)', background: isOpChecked ? 'var(--primary-50)' : 'transparent', transition: 'var(--transition-fast)' }}>
                  <div style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', cursor: 'pointer' }} onClick={() => handleOperatorToggle(opId)}>
                    <input 
                      type="checkbox" 
                      checked={isOpChecked} 
                      readOnly 
                      className="custom-checkbox"
                      style={{ marginRight: '12px' }} 
                    />
                    <span style={{ fontSize: '14px', fontWeight: isOpChecked ? 600 : 500, color: isOpChecked ? 'var(--primary-700)' : 'var(--neutral-900)' }}>
                      {mapping.name}
                    </span>
                  </div>
                  
                  {isOpChecked && (
                    <div style={{ padding: '0 16px 16px 44px', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '8px' }}>
                      {providers.length === 0 ? (
                        <span style={{ fontSize: '13px', color: 'var(--neutral-500)', fontStyle: 'italic', gridColumn: '1/-1' }}>Không có cấu hình nhà cung cấp.</span>
                      ) : (
                        providers.map((p: any) => {
                          const isProvChecked = selectedProvs.includes(p.id);
                          const overlapId = overlapProviders[p.id];
                          const isDisabled = !!overlapId;

                          return (
                            <label key={p.id} style={{
                              display: 'inline-flex', alignItems: 'center', gap: '6px',
                              padding: '8px 14px', borderRadius: 'var(--radius-full)',
                              border: `1px solid ${isDisabled ? 'var(--neutral-200)' : isProvChecked ? 'var(--primary-500)' : 'var(--neutral-300)'}`,
                              background: isDisabled ? 'var(--neutral-100)' : isProvChecked ? 'var(--primary-50)' : '#FFFFFF',
                              color: isDisabled ? 'var(--neutral-400)' : isProvChecked ? 'var(--primary-700)' : 'var(--neutral-700)',
                              cursor: isDisabled ? 'not-allowed' : 'pointer', fontSize: '13px', transition: 'var(--transition-fast)',
                              whiteSpace: 'normal',
                              wordBreak: 'break-word',
                              textAlign: 'left',
                              justifyContent: 'flex-start',
                              opacity: isDisabled ? 0.7 : 1,
                              fontWeight: isProvChecked && !isDisabled ? 600 : 500,
                              boxShadow: isProvChecked && !isDisabled ? '0 1px 2px rgba(0, 122, 255, 0.05)' : 'none'
                            }}>
                              <input 
                                type="checkbox" 
                                checked={isProvChecked}
                                disabled={isDisabled}
                                onChange={(e) => { e.stopPropagation(); handleProviderToggle(opId, p.id); }}
                                style={{ display: 'none' }}
                              />
                              {isProvChecked && !isDisabled && <CheckCircle size={14} style={{ flexShrink: 0, color: 'var(--primary-600)' }} />}
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                <span>{p.name}</span>
                                {overlapId && (
                                  <a 
                                    href={`/tra-cuu?id=${overlapId}`}
                                    target="_blank"
                                    rel="noreferrer"
                                    onClick={(e) => e.stopPropagation()}
                                    style={{ fontSize: '11px', color: 'var(--primary-600)', fontStyle: 'italic', textDecoration: 'underline', cursor: 'pointer', pointerEvents: 'auto' }}
                                  >
                                    (Đã nhập trong tháng này)
                                  </a>
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
          <label className="label-custom">Ghi chú</label>
          <textarea className="input-field" rows={2} placeholder="Thông tin bổ sung..." value={note} onChange={e => setNote(e.target.value)}></textarea>
        </div>

        <div style={{ display: 'flex', gap: '12px' }}>
          <button className="btn btn-primary" onClick={handleSubmit} disabled={isSubmitting}>
            <Save size={16} /> {isSubmitting ? 'Đang xử lý...' : isEditMode ? 'Cập Nhật Thông Tin Hủy' : 'Lưu Thông Tin Hủy'}
          </button>
          
          {isEditMode && (
            <button className="btn btn-secondary" onClick={handleCancelEdit}>
              Hủy chỉnh sửa
            </button>
          )}
        </div>
      </div>

      {/* Right: Preview Panel (42%) */}
      <div style={{ flex: '0 0 42%', position: 'sticky', top: '24px' }}>
        <div className="card-container" style={{ padding: 0, overflow: 'hidden', boxShadow: 'var(--shadow-md)' }}>
          <div style={{ padding: '18px 20px', background: 'var(--neutral-100)', borderBottom: '1.5px solid var(--neutral-200)' }}>
            <h3 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--neutral-900)', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
              Bản xem trước dữ liệu
            </h3>
          </div>
          
          <table className="custom-table" style={{ fontSize: '13.5px' }}>
            <thead>
              <tr>
                <th style={{ width: '35%' }}>Nhà mạng</th>
                <th>Nhà cung cấp đã chọn</th>
              </tr>
            </thead>
            <tbody>
              {selectedOperators.length === 0 ? (
                <tr>
                  <td colSpan={2} style={{ textAlign: 'center', padding: '32px 16px', color: 'var(--neutral-500)' }}>
                    Chưa có nhà mạng nào được chọn
                  </td>
                </tr>
              ) : (
                selectedOperators.map(opId => {
                  const opName = lookups.opMap[opId] || opId;
                  const selectedForOp = selectedProviders[opId] || [];

                  return (
                    <tr key={opId}>
                      <td style={{ verticalAlign: 'top', fontWeight: 600, color: 'var(--neutral-900)' }}>{opName}</td>
                      <td style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                        {selectedForOp.length === 0 ? (
                          <span style={{ color: 'var(--neutral-400)' }}>--</span>
                        ) : (
                          selectedForOp.map(pid => {
                            const pname = lookups.provMap[pid] || pid;
                            return (
                              <span key={pid} className="badge-custom badge-primary" style={{ display: 'inline-block' }}>
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
        .border-red { border-color: var(--error-600) !important; background-color: var(--error-50) !important; }
        .text-error-600 { color: var(--error-600); }
        .label-custom { display: block; font-size: 13px; font-weight: 600; margin-bottom: 8px; color: var(--neutral-700); }
        
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
        }
        .dropdown-item:last-child {
          border-bottom: none;
        }
        .dropdown-item:hover {
          background-color: var(--primary-50);
          color: var(--primary-700);
          font-weight: 600;
        }

        /* Tiny add button next to input */
        .add-btn-small {
          padding: 0 12px;
          font-size: 12px;
          white-space: nowrap;
          border: 1px solid var(--primary-600);
          color: var(--primary-600);
          background: transparent;
          font-weight: 600;
          border-radius: var(--radius-sm);
          transition: var(--transition-fast);
        }
        .add-btn-small:hover {
          background: var(--primary-50);
        }

        /* Warning styles inside form */
        .alert-inside-form {
          margin-top: 8px;
          padding: 8px 12px;
          background: var(--warning-50);
          border: 1px solid var(--warning-100);
          border-radius: var(--radius-sm);
          font-size: 12.5px;
          color: var(--warning-700);
          display: flex;
          align-items: center;
        }
        .btn-link-inline {
          background: none;
          border: none;
          color: var(--primary-600);
          text-decoration: underline;
          cursor: pointer;
          padding: 0 4px;
          font-weight: 600;
          font-size: 12.5px;
        }
        .btn-link-inline:hover {
          color: var(--primary-700);
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
