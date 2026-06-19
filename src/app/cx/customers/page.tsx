'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Search, ChevronDown, CheckCircle, Clock, X, ChevronRight, FileText, UserPlus, Eye, EyeOff, Building2, User, Phone, Mail, Settings, Calendar, FilterX, Filter, Download } from 'lucide-react';
import Customer360Drawer from '@/components/Customer360Drawer';
import { getCustomersOverview, searchCustomers, getDropdownConfigs } from '@/lib/cx-actions';
import ExcelJS from 'exceljs';

function MultiSelectFilter({ label, options, selected, toggle }: { label: string, options: string[], selected: string[], toggle: (val: string) => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    const clickOut = (e: any) => { if(ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', clickOut);
    return () => document.removeEventListener('mousedown', clickOut);
  }, []);

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <label className="label-custom">{label}</label>
      <div className="input-field w-full" style={{ minHeight: '40px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', background: '#fff' }} onClick={() => setOpen(!open)}>
        <span style={{ fontSize: '13px', color: selected.length ? 'var(--neutral-900)' : 'var(--neutral-500)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', display: 'block', maxWidth: 'calc(100% - 20px)' }}>
          {selected.length === 0 ? 'Tất cả' : selected.join(', ')}
        </span>
        <ChevronDown size={14} color="var(--neutral-500)" />
      </div>
      {open && (
        <div style={{ position: 'absolute', top: 'calc(100% + 4px)', left: 0, right: 0, zIndex: 100, background: '#fff', border: '1px solid var(--neutral-200)', borderRadius: '8px', boxShadow: 'var(--shadow-md)', maxHeight: '250px', overflowY: 'auto', padding: '4px' }}>
          {options.map(o => (
            <label key={o} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 12px', cursor: 'pointer', borderRadius: '4px', background: selected.includes(o) ? 'var(--primary-50)' : 'transparent', color: selected.includes(o) ? 'var(--primary-700)' : 'var(--neutral-700)', fontSize: '13px', margin: 0 }} onMouseOver={e => !selected.includes(o) && (e.currentTarget.style.background = 'var(--neutral-50)')} onMouseOut={e => !selected.includes(o) && (e.currentTarget.style.background = 'transparent')}>
              <input type="checkbox" checked={selected.includes(o)} onChange={() => toggle(o)} style={{ width: '16px', height: '16px', cursor: 'pointer', margin: 0 }} />
              <span style={{ fontWeight: selected.includes(o) ? 600 : 400 }}>{o}</span>
            </label>
          ))}
          {options.length === 0 && <div style={{ padding: '8px 12px', fontSize: '13px', color: 'var(--neutral-500)', textAlign: 'center' }}>Chưa có dữ liệu</div>}
        </div>
      )}
    </div>
  );
}

export default function CustomersPage() {
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [configs, setConfigs] = useState<any>({});
  const [hasSearched, setHasSearched] = useState(false);
  
  const [activeCustomer, setActiveCustomer] = useState<string | null>(null);
  const [expandedCustomer, setExpandedCustomer] = useState<string | null>(null);
  const [visiblePasswords, setVisiblePasswords] = useState<Record<string, boolean>>({});
  
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  const [filterCustomerId, setFilterCustomerId] = useState<string | null>(null);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  
  const [filterStatus, setFilterStatus] = useState<string[]>([]);
  const [filterDateRange, setFilterDateRange] = useState({ start: '', end: '' });
  const [filterExpiry, setFilterExpiry] = useState<string[]>([]);
  const [filterCustomerSuccess, setFilterCustomerSuccess] = useState<string[]>([]);
  const [filterSale, setFilterSale] = useState<string[]>([]);
  const [filterCustomerSupport, setFilterCustomerSupport] = useState<string[]>([]);
  const [filterPhanKhuc, setFilterPhanKhuc] = useState<string[]>([]);
  const [filterKhuVuc, setFilterKhuVuc] = useState<string[]>([]);
  const [filterKenhGuiTin, setFilterKenhGuiTin] = useState<string[]>([]);
  const [filterDuLieuInput, setFilterDuLieuInput] = useState<string[]>([]);

  useEffect(() => {
    fetchData();
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSearchDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (searchQuery.trim().length >= 2) {
        performSearch(searchQuery);
      } else {
        setSearchResults([]);
        setShowSearchDropdown(false);
      }
    }, 400);
    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery]);

  const fetchData = async () => {
    setLoading(true);
    const [custRes, confRes] = await Promise.all([
      getCustomersOverview(),
      getDropdownConfigs()
    ]);
    if (custRes.success && custRes.data) setCustomers(custRes.data);
    if (confRes.success && confRes.data) setConfigs(confRes.data);
    setLoading(false);
  };

  const performSearch = async (query: string) => {
    setIsSearching(true);
    
    const q = query.toLowerCase().trim();
    if (!q) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    // Local search logic using pre-computed searchText (O(n) complexity)
    const results = customers.filter(c => {
      if (c.searchText) {
        // Hỗ trợ tìm nhiều từ khóa cách nhau bằng dấu cách
        const queryTerms = q.split(' ').filter(Boolean);
        return queryTerms.every(term => c.searchText.includes(term));
      }

      // Fallback in case searchText is not available for some reason
      const matchCustomer = 
        (c.customer_id && c.customer_id.toLowerCase().includes(q)) ||
        (c.ten_cong_ty && c.ten_cong_ty.toLowerCase().includes(q)) ||
        (c.org_id && c.org_id.toString().toLowerCase().includes(q)) ||
        (c.cpid && c.cpid.toString().toLowerCase().includes(q)) ||
        (c.cp_name && c.cp_name.toLowerCase().includes(q));

      const matchService = c.services && c.services.some((s: any) => 
        (s.brand_name_oa && s.brand_name_oa.toLowerCase().includes(q)) ||
        (s.cp_name_code && s.cp_name_code.toLowerCase().includes(q)) ||
        (s.service_id && s.service_id.toLowerCase().includes(q))
      );

      return matchCustomer || matchService;
    }).slice(0, 20);

    setSearchResults(results);
    setIsSearching(false);
    setShowSearchDropdown(true);
  };

  const toggleFilter = (list: string[], setList: any, value: string) => {
    if (list.includes(value)) setList(list.filter(v => v !== value));
    else setList([...list, value]);
  };

  const clearAllFilters = () => {
    setFilterCustomerId(null);
    setFilterStatus([]);
    setFilterDateRange({ start: '', end: '' });
    setFilterExpiry([]);
    setFilterCustomerSuccess([]);
    setFilterSale([]);
    setFilterCustomerSupport([]);
    setFilterPhanKhuc([]);
    setFilterKhuVuc([]);
    setFilterKenhGuiTin([]);
    setFilterDuLieuInput([]);
  };

  const filteredCustomers = customers.filter(c => {
    if (filterCustomerId && c.customer_id !== filterCustomerId) return false;
    if (filterStatus.length && !filterStatus.includes(c.trang_thai)) return false;
    
    const cs = c.customer_success || c.cs_in_charge;
    const sale = c.sale_phu_trach || c.sale_in_charge;

    if (filterCustomerSuccess.length && !filterCustomerSuccess.includes(cs)) return false;
    if (filterSale.length && !filterSale.includes(sale)) return false;
    if (filterPhanKhuc.length && !filterPhanKhuc.includes(c.phan_khuc)) return false;
    if (filterKhuVuc.length && !filterKhuVuc.includes(c.khu_vuc)) return false;
    if (filterKenhGuiTin.length && !filterKenhGuiTin.includes(c.kenh_gui_tin)) return false;
    if (filterDuLieuInput.length && !filterDuLieuInput.includes(c.du_lieu_input)) return false;

    if (filterCustomerSupport.length) {
      const hasMatchedSup = filterCustomerSupport.some(sup => c.sup_phu_trach_list?.includes(sup));
      if (!hasMatchedSup) return false;
    }

    if (filterDateRange.start) {
      if (new Date(c.created_at) < new Date(filterDateRange.start)) return false;
    }
    if (filterDateRange.end) {
      const endD = new Date(filterDateRange.end);
      endD.setHours(23, 59, 59);
      if (new Date(c.created_at) > endD) return false;
    }

    if (filterExpiry.length > 0) {
      const today = new Date();
      let matched = false;
      const expiries = c.service_expiries || [];
      for (const filter of filterExpiry) {
        if (filter === 'Đã hết hạn' && expiries.some((ds: string) => new Date(ds) < today)) matched = true;
        if (filter === 'Còn < 15 ngày' && expiries.some((ds: string) => {
          const d = new Date(ds);
          const diff = (d.getTime() - today.getTime()) / 86400000;
          return diff >= 0 && diff <= 15;
        })) matched = true;
        if (filter === 'Còn < 45 ngày' && expiries.some((ds: string) => {
          const d = new Date(ds);
          const diff = (d.getTime() - today.getTime()) / 86400000;
          return diff > 15 && diff <= 45;
        })) matched = true;
      }
      if (!matched) return false;
    }
    return true;
  });

  const handleExportExcel = async () => {
    try {
      const workbook = new ExcelJS.Workbook();
      
      // 1. Sheet Khách hàng
      const sheet1 = workbook.addWorksheet('Khách hàng');
      const excludeCustomerKeys = ['contracts', 'services', 'total_contracts', 'total_services', 'service_types', 'sup_phu_trach_list'];
      const customerKeys = filteredCustomers.length > 0 ? Object.keys(filteredCustomers[0]).filter(k => !excludeCustomerKeys.includes(k)) : [];
      
      sheet1.columns = customerKeys.map(k => ({ header: k, key: k, width: 20 }));
      filteredCustomers.forEach(c => {
        const rowData: any = {};
        customerKeys.forEach(k => rowData[k] = c[k]);
        sheet1.addRow(rowData);
      });
      sheet1.getRow(1).font = { bold: true };

      // 2. Sheet Hợp đồng
      const sheet2 = workbook.addWorksheet('Hợp đồng');
      const allContracts = filteredCustomers.flatMap(c => c.contracts || []);
      const contractKeys = allContracts.length > 0 ? Object.keys(allContracts[0]) : ['contract_id', 'customer_id', 'trang_thai'];
      sheet2.columns = contractKeys.map(k => ({ header: k, key: k, width: 20 }));
      allContracts.forEach(ct => sheet2.addRow(ct));
      sheet2.getRow(1).font = { bold: true };

      // 3. Sheet Dịch vụ
      const sheet3 = workbook.addWorksheet('Dịch vụ');
      const allServices = filteredCustomers.flatMap(c => c.services || []);
      const serviceKeys = allServices.length > 0 ? Object.keys(allServices[0]) : ['service_id', 'contract_id', 'customer_id', 'loai_dich_vu'];
      sheet3.columns = serviceKeys.map(k => ({ header: k, key: k, width: 20 }));
      allServices.forEach(sv => sheet3.addRow(sv));
      sheet3.getRow(1).font = { bold: true };

      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Du_Lieu_Khach_Hang_${new Date().getTime()}.xlsx`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Export failed:', err);
      alert('Có lỗi xảy ra khi xuất file Excel');
    }
  };

  const isAnyFilterActive = filterCustomerId || filterStatus.length || filterDateRange.start || filterDateRange.end || filterExpiry.length || filterCustomerSuccess.length || filterSale.length || filterCustomerSupport.length || filterPhanKhuc.length || filterKhuVuc.length || filterKenhGuiTin.length || filterDuLieuInput.length;

  return (
    <>
      <div className="animate-fade-in" style={{ padding: '32px', maxWidth: '1400px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '20px' }}>
        <div>
          <h1 style={{ fontSize: '28px', fontWeight: 800, color: 'var(--neutral-900)', margin: '0 0 8px 0', display: 'flex', alignItems: 'center', gap: '12px' }}>
            Tra cứu Khách hàng <span className="badge-custom" style={{ background: 'var(--primary-100)', color: 'var(--primary-800)', fontSize: '14px', verticalAlign: 'middle' }}>{filteredCustomers.length} KH</span>
          </h1>
          <p style={{ color: 'var(--neutral-500)', margin: 0, fontSize: '15px' }}>Tra cứu nhanh, xem hồ sơ 360 độ và quản lý tổng quan khách hàng</p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button className="btn btn-secondary" onClick={handleExportExcel} style={{ padding: '10px 16px', display: 'flex', alignItems: 'center', gap: '8px', background: '#fff', border: '1px solid var(--neutral-200)', boxShadow: 'var(--shadow-sm)' }}>
            <Download size={18} color="var(--neutral-600)" />
            <span style={{ fontWeight: 600, color: 'var(--neutral-700)' }}>Xuất Excel</span>
          </button>
        </div>
      </div>

      <div ref={searchRef} style={{ position: 'relative', zIndex: 9999 }}>
        <div style={{ position: 'relative' }}>
          <div style={{ position: 'absolute', left: '20px', top: '50%', transform: 'translateY(-50%)', color: 'var(--neutral-400)' }}>
            <Search size={24} />
          </div>
          <input
            className="input-field w-full"
            placeholder="Tra cứu nhanh mã KH, tên công ty, Brandname, CPID..."
            style={{ padding: '20px 20px 20px 56px', fontSize: '16px', borderRadius: '16px', border: '2px solid var(--primary-100)', boxShadow: '0 8px 24px rgba(0,0,0,0.04)', transition: 'all 0.2s' }}
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            onClick={() => { if (searchQuery.length >= 2) setShowSearchDropdown(true); }}
            onFocus={() => { if (searchQuery.length >= 2) setShowSearchDropdown(true); }}
          />
          {searchQuery && (
            <button 
              style={{ position: 'absolute', right: '20px', top: '50%', transform: 'translateY(-50%)', background: 'transparent', border: 'none', cursor: 'pointer', padding: '4px' }}
              onClick={() => { setSearchQuery(''); setSearchResults([]); setShowSearchDropdown(false); setFilterCustomerId(null); }}
              title="Xóa tìm kiếm"
            >
              <X size={20} color="var(--neutral-400)" />
            </button>
          )}
        </div>

        {showSearchDropdown && (
          <div style={{ position: 'absolute', top: 'calc(100% + 8px)', left: 0, width: '900px', maxWidth: '90vw', background: '#fff', borderRadius: '16px', boxShadow: '0 12px 32px rgba(0,0,0,0.15)', border: '1px solid var(--neutral-200)', maxHeight: '600px', overflowY: 'auto', padding: '16px', zIndex: 100 }}>
            {isSearching ? (
              <div style={{ padding: '32px', textAlign: 'center', color: 'var(--neutral-500)' }}>Đang tìm kiếm...</div>
            ) : searchResults.length === 0 ? (
              <div style={{ padding: '32px', textAlign: 'center', color: 'var(--neutral-500)' }}>Không tìm thấy khách hàng hoặc dịch vụ phù hợp.</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {searchResults.map(c => (
                  <div key={c.customer_id} className="search-result-card" style={{ padding: '16px', borderRadius: '12px', border: '1px solid var(--neutral-100)', cursor: 'pointer', background: 'var(--neutral-50)', transition: 'all 0.2s' }} onClick={() => { setFilterCustomerId(c.customer_id); setShowSearchDropdown(false); }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                      <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                        <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'var(--primary-100)', color: 'var(--primary-700)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          <Building2 size={20} />
                        </div>
                        <div>
                          <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--neutral-900)' }}>{c.ten_cong_ty || '--'}</div>
                          <div style={{ fontSize: '13px', color: 'var(--neutral-600)', display: 'flex', flexWrap: 'wrap', gap: '12px', marginTop: '6px' }}>
                            <span><strong style={{ color: 'var(--neutral-500)', fontWeight: 500 }}>Mã KH:</strong> <span style={{ fontWeight: 600 }}>{c.customer_id}</span></span>
                            <span><strong style={{ color: 'var(--neutral-500)', fontWeight: 500 }}>Org ID:</strong> {c.org_id || '--'}</span>
                            <span><strong style={{ color: 'var(--neutral-500)', fontWeight: 500 }}>Tài khoản:</strong> {c.ten_tai_khoan || '--'}</span>
                            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <strong style={{ color: 'var(--neutral-500)', fontWeight: 500 }}>Mật khẩu:</strong> 
                              {c.mat_khau ? (visiblePasswords[c.customer_id] ? c.mat_khau : '••••••••') : '--'}
                              {c.mat_khau && (
                                <button 
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setVisiblePasswords(prev => ({...prev, [c.customer_id]: !prev[c.customer_id]}));
                                  }}
                                  style={{ background: 'transparent', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: 0 }}
                                >
                                  {visiblePasswords[c.customer_id] ? <EyeOff size={14} color="var(--neutral-500)"/> : <Eye size={14} color="var(--neutral-500)"/>}
                                </button>
                              )}
                            </span>
                            <span><strong style={{ color: 'var(--neutral-500)', fontWeight: 500 }}>CS:</strong> <span style={{ color: 'var(--primary-600)', fontWeight: 600 }}>{c.customer_success || c.cs_in_charge || '--'}</span></span>
                          </div>
                        </div>
                      </div>
                      <button className="badge-custom btn-secondary hover-bg-gray" style={{ background: '#fff', border: '1px solid var(--neutral-200)', color: 'var(--neutral-700)', flexShrink: 0, padding: '6px 12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }} onClick={(e) => { e.stopPropagation(); setActiveCustomer(c.customer_id); setShowSearchDropdown(false); }}>
                        Xem 360
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
            <button 
              className={`btn ${showAdvancedFilters ? 'btn-primary' : 'btn-secondary'}`} 
              onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
              style={{ padding: '12px 20px', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 600, border: '1px solid var(--neutral-200)', background: showAdvancedFilters ? 'var(--primary-50)' : '#fff', color: showAdvancedFilters ? 'var(--primary-700)' : 'var(--neutral-700)' }}
            >
              <Filter size={18} />
              Bộ lọc nâng cao
              <ChevronDown size={16} style={{ transition: 'transform 0.2s', transform: showAdvancedFilters ? 'rotate(180deg)' : 'none' }} />
            </button>

            {isAnyFilterActive && (
              <button className="btn btn-secondary" onClick={clearAllFilters} style={{ background: 'transparent', border: 'none', color: 'var(--neutral-500)', padding: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <FilterX size={16} /> Xóa bộ lọc
              </button>
            )}
          </div>

          {showAdvancedFilters && (
            <div className="animate-fade-in-up" style={{ background: '#fff', padding: '24px', borderRadius: '16px', boxShadow: 'var(--shadow-md)', border: '1px solid var(--primary-100)', display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
                <MultiSelectFilter label="Trạng thái" options={['Active', 'Inactive']} selected={filterStatus} toggle={(v) => toggleFilter(filterStatus, setFilterStatus, v)} />
                <MultiSelectFilter label="Thời gian hết hạn" options={['Còn < 15 ngày', 'Còn < 45 ngày', 'Đã hết hạn']} selected={filterExpiry} toggle={(v) => toggleFilter(filterExpiry, setFilterExpiry, v)} />
                <div>
                  <label className="label-custom">Ngày tạo (Từ)</label>
                  <input type="date" className="input-field w-full" style={{ height: '40px' }} value={filterDateRange.start} onChange={e => setFilterDateRange({...filterDateRange, start: e.target.value})} />
                </div>
                <div>
                  <label className="label-custom">Ngày tạo (Đến)</label>
                  <input type="date" className="input-field w-full" style={{ height: '40px' }} value={filterDateRange.end} onChange={e => setFilterDateRange({...filterDateRange, end: e.target.value})} />
                </div>
              </div>

              <div style={{ height: '1px', background: 'var(--neutral-100)' }} />

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
                <MultiSelectFilter label="Customer Success (CS)" options={configs.customerSuccess || []} selected={filterCustomerSuccess} toggle={(v) => toggleFilter(filterCustomerSuccess, setFilterCustomerSuccess, v)} />
                <MultiSelectFilter label="Sale phụ trách" options={configs.tenSale || []} selected={filterSale} toggle={(v) => toggleFilter(filterSale, setFilterSale, v)} />
                <MultiSelectFilter label="Customer Support (SUP)" options={configs.customerSupport || []} selected={filterCustomerSupport} toggle={(v) => toggleFilter(filterCustomerSupport, setFilterCustomerSupport, v)} />
              </div>

              <div style={{ height: '1px', background: 'var(--neutral-100)' }} />

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
                <MultiSelectFilter label="Phân khúc" options={configs.phanKhuc || []} selected={filterPhanKhuc} toggle={(v) => toggleFilter(filterPhanKhuc, setFilterPhanKhuc, v)} />
                <MultiSelectFilter label="Khu vực" options={configs.khuVuc || []} selected={filterKhuVuc} toggle={(v) => toggleFilter(filterKhuVuc, setFilterKhuVuc, v)} />
                <MultiSelectFilter label="Kênh gửi tin" options={configs.kenhGuiTin || []} selected={filterKenhGuiTin} toggle={(v) => toggleFilter(filterKenhGuiTin, setFilterKenhGuiTin, v)} />
                <MultiSelectFilter label="Dữ liệu Input" options={configs.duLieuInput || []} selected={filterDuLieuInput} toggle={(v) => toggleFilter(filterDuLieuInput, setFilterDuLieuInput, v)} />
              </div>
            </div>
          )}

          <div style={{ background: '#fff', borderRadius: '16px', border: '1px solid var(--neutral-200)', overflow: 'hidden', boxShadow: 'var(--shadow-sm)' }}>
            <div style={{ overflowX: 'auto' }}>
              <table className="custom-table" style={{ margin: 0, minWidth: '1000px' }}>
                <thead>
                  <tr>
                    <th>Tên công ty / Mã KH</th>
                    <th>Org ID</th>
                    <th>CP Name</th>
                    <th>Tên tài khoản</th>
                    <th>Mật khẩu</th>
                    <th>CS</th>
                    <th>Dịch vụ / Support</th>
                    <th>Sale</th>
                    <th>Trạng thái</th>
                    <th style={{ textAlign: 'center' }}>Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={10} style={{ textAlign: 'center', padding: '48px', color: 'var(--neutral-500)' }}>
                        <div style={{ display: 'inline-block', width: '24px', height: '24px', border: '3px solid var(--neutral-200)', borderTopColor: 'var(--primary-600)', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
                      </td>
                    </tr>
                  ) : filteredCustomers.length === 0 ? (
                    <tr>
                      <td colSpan={10} style={{ textAlign: 'center', padding: '48px', color: 'var(--neutral-500)' }}>
                        Không có khách hàng nào phù hợp với bộ lọc.
                      </td>
                    </tr>
                  ) : (
                    filteredCustomers.map((c) => (
                      <React.Fragment key={c.customer_id}>
                        <tr 
                          className="row-hover" 
                          style={{ cursor: 'pointer', background: expandedCustomer === c.customer_id ? 'var(--primary-50)' : 'transparent' }}
                          onClick={() => setExpandedCustomer(expandedCustomer === c.customer_id ? null : c.customer_id)}
                        >
                          <td>
                            <div style={{ fontWeight: 600, color: 'var(--neutral-900)' }}>{c.ten_cong_ty || '--'}</div>
                            <div style={{ fontSize: '13px', color: 'var(--neutral-500)', marginTop: '4px' }}>{c.customer_id}</div>
                          </td>
                          <td style={{ color: 'var(--neutral-600)' }}>{c.org_id || '--'}</td>
                          <td style={{ color: 'var(--neutral-600)' }}>{c.cp_name || '--'}</td>
                          <td style={{ color: 'var(--neutral-900)', fontWeight: 500 }}>{c.ten_tai_khoan || '--'}</td>
                          <td>
                            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                              {c.mat_khau ? (visiblePasswords[c.customer_id] ? c.mat_khau : '••••••••') : '--'}
                              {c.mat_khau && (
                                <button 
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setVisiblePasswords(prev => ({...prev, [c.customer_id]: !prev[c.customer_id]}));
                                  }}
                                  style={{ background: 'transparent', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: 0 }}
                                >
                                  {visiblePasswords[c.customer_id] ? <EyeOff size={14} color="var(--neutral-500)"/> : <Eye size={14} color="var(--neutral-500)"/>}
                                </button>
                              )}
                            </span>
                          </td>
                          <td style={{ color: 'var(--neutral-700)', fontWeight: 500 }}>{c.customer_success || c.cs_in_charge || '--'}</td>
                          <td>
                            <div style={{ fontSize: '13px' }}>
                              {(() => {
                                if (!c.services || c.services.length === 0) return '--';
                                const uniquePairs = new Set();
                                const pairs: { loai: string, sup: string }[] = [];
                                c.services.forEach((s: any) => {
                                  if (s.loai_dich_vu || s.sup_phu_trach) {
                                    const key = `${s.loai_dich_vu}|${s.sup_phu_trach}`;
                                    if (!uniquePairs.has(key)) {
                                      uniquePairs.add(key);
                                      pairs.push({ loai: s.loai_dich_vu || 'Không rõ', sup: s.sup_phu_trach || 'Chưa gán' });
                                    }
                                  }
                                });
                                if (pairs.length === 0) return '--';
                                return pairs.map((p, idx) => (
                                  <div key={idx} style={{ marginBottom: idx < pairs.length - 1 ? '4px' : 0 }}>
                                    <span style={{ color: 'var(--primary-700)', fontWeight: 500 }}>{p.loai}</span>
                                    <span style={{ color: 'var(--neutral-400)', margin: '0 6px' }}>—</span>
                                    <strong style={{ color: 'var(--neutral-800)' }}>{p.sup}</strong>
                                  </div>
                                ));
                              })()}
                            </div>
                          </td>
                          <td style={{ color: 'var(--neutral-700)', fontWeight: 500 }}>{c.sale_phu_trach || c.sale_in_charge || '--'}</td>
                          <td>
                            <span className="badge-custom" style={{ 
                              background: c.trang_thai === 'Active' ? 'var(--primary-50)' : 'var(--neutral-100)', 
                              color: c.trang_thai === 'Active' ? 'var(--primary-700)' : 'var(--neutral-600)',
                              border: c.trang_thai === 'Active' ? '1px solid var(--primary-200)' : '1px solid var(--neutral-300)'
                            }}>
                              {c.trang_thai === 'Active' ? 'Hoạt động' : 'Tạm ngưng'}
                            </span>
                          </td>
                          <td style={{ textAlign: 'center' }} onClick={(e) => e.stopPropagation()}>
                            <button 
                              onClick={() => setActiveCustomer(c.customer_id)}
                              className="btn btn-secondary" 
                              style={{ padding: '6px 12px', fontSize: '13px', background: '#fff', border: '1px solid var(--primary-200)', color: 'var(--primary-700)', fontWeight: 600, cursor: 'pointer' }}
                            >
                              Xem 360
                            </button>
                          </td>
                        </tr>
                        
                        {/* Expandable Services Row */}
                        {expandedCustomer === c.customer_id && (
                          <tr>
                            <td colSpan={10} style={{ padding: '0', borderBottom: '1px solid var(--neutral-200)' }}>
                              <div className="animate-fade-in-down" style={{ background: 'var(--neutral-50)', padding: '24px 32px', borderTop: '1px dashed var(--neutral-200)' }}>
                                <h4 style={{ margin: '0 0 16px 0', fontSize: '15px', color: 'var(--neutral-800)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                  <FileText size={18} color="var(--primary-600)" />
                                  Chi tiết Dịch vụ & Support phụ trách
                                </h4>
                            
                            {c.services && c.services.length > 0 ? (
                              <div style={{ overflowX: 'auto', background: '#fff', borderRadius: '8px', border: '1px solid var(--neutral-200)' }}>
                                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', textAlign: 'left' }}>
                                  <thead>
                                    <tr style={{ background: 'var(--neutral-50)', borderBottom: '1px solid var(--neutral-200)' }}>
                                      <th style={{ padding: '10px 16px', fontWeight: 600, color: 'var(--neutral-600)' }}>Loại dịch vụ</th>
                                      <th style={{ padding: '10px 16px', fontWeight: 600, color: 'var(--neutral-600)' }}>Brandname/OA</th>
                                      <th style={{ padding: '10px 16px', fontWeight: 600, color: 'var(--neutral-600)' }}>CP Name</th>
                                      <th style={{ padding: '10px 16px', fontWeight: 600, color: 'var(--neutral-600)' }}>Support (SUP)</th>
                                      <th style={{ padding: '10px 16px', fontWeight: 600, color: 'var(--neutral-600)' }}>Trạng thái</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {c.services.map((s: any) => (
                                      <tr key={s.service_id} style={{ borderBottom: '1px solid var(--neutral-100)' }}>
                                        <td style={{ padding: '10px 16px', fontWeight: 600, color: 'var(--neutral-900)' }}>{s.loai_dich_vu}</td>
                                        <td style={{ padding: '10px 16px', color: 'var(--neutral-700)' }}>{s.brand_name_oa || '--'}</td>
                                        <td style={{ padding: '10px 16px', color: 'var(--neutral-700)' }}>{s.cp_name_code || '--'}</td>
                                        <td style={{ padding: '10px 16px', fontWeight: 600, color: 'var(--gold-700)' }}>{s.sup_phu_trach || '--'}</td>
                                        <td style={{ padding: '10px 16px' }}>
                                          <span className="badge-custom" style={{ 
                                            background: s.trang_thai === 'Active' ? 'var(--primary-50)' : 'var(--neutral-100)', 
                                            color: s.trang_thai === 'Active' ? 'var(--primary-700)' : 'var(--neutral-600)',
                                            padding: '2px 8px'
                                          }}>
                                            {s.trang_thai}
                                          </span>
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            ) : (
                              <div style={{ padding: '16px', textAlign: 'center', color: 'var(--neutral-500)', background: '#fff', borderRadius: '12px', border: '1px dashed var(--neutral-300)' }}>
                                Khách hàng chưa có dịch vụ nào
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
      </div>

      <Customer360Drawer 
        isOpen={!!activeCustomer} 
        customerId={activeCustomer} 
        onClose={() => setActiveCustomer(null)}
      />
    </>
  );
}
