"use client";

import React, { useState, useEffect, useRef } from 'react';
import { Search, ChevronDown, CheckCircle, Clock, X, ChevronRight, FileText, UserPlus, Eye, EyeOff, Building2, User, Phone, Mail, Settings, Calendar, FilterX, Filter, Download } from 'lucide-react';
import Customer360Drawer from '@/components/Customer360Drawer';
import Pagination from '@/components/ui/Pagination';
import FilterBar from '@/components/ui/FilterBar';
import StatusBadge from '@/components/ui/StatusBadge';
import { getCustomersOverview, getDropdownConfigs } from '@/lib/cx-actions';
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
      <label className="label-custom" style={{ fontSize: '12px', fontWeight: 600, color: 'var(--neutral-600)', marginBottom: '4px', display: 'block' }}>{label}</label>
      <div className="input-field" style={{ width: '100%', minHeight: '36px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', background: '#fff' }} onClick={() => setOpen(!open)}>
        <span style={{ fontSize: '13px', color: selected.length ? 'var(--neutral-900)' : 'var(--neutral-500)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', display: 'block', maxWidth: 'calc(100% - 20px)' }}>
          {selected.length === 0 ? 'Tất cả' : selected.join(', ')}
        </span>
        <ChevronDown size={14} color="var(--neutral-500)" />
      </div>
      {open && (
        <div className="animate-fade-in-up" style={{ position: 'absolute', top: 'calc(100% + 4px)', left: 0, right: 0, zIndex: 100, background: '#fff', border: '1px solid var(--neutral-200)', borderRadius: 'var(--radius-md)', boxShadow: 'var(--shadow-lg)', maxHeight: '250px', overflowY: 'auto', padding: '4px' }}>
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
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
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
  const didMountSearch = useRef(false);
  const didMountFilters = useRef(false);

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

  const getCurrentFilters = () => ({
    customerId: filterCustomerId,
    statuses: filterStatus,
    createdFrom: filterDateRange.start,
    createdTo: filterDateRange.end,
    expiry: filterExpiry,
    customerSuccess: filterCustomerSuccess,
    sale: filterSale,
    customerSupport: filterCustomerSupport,
    phanKhuc: filterPhanKhuc,
    khuVuc: filterKhuVuc,
    kenhGuiTin: filterKenhGuiTin,
    duLieuInput: filterDuLieuInput,
  });

  const fetchData = async (page = 1, query = '') => {
    setLoading(true);
    const [custRes, confRes] = await Promise.all([
      getCustomersOverview(page, 20, query, getCurrentFilters()),
      getDropdownConfigs()
    ]);
    if (custRes.success && custRes.data) {
      setCustomers(custRes.data);
      if (page === 1 && query.trim().length >= 2) setSearchResults(custRes.data);
      setTotalPages(custRes.totalPages || 1);
      setTotalRecords(custRes.totalRecords || 0);
      setCurrentPage(custRes.currentPage || 1);
    }
    if (confRes.success && confRes.data) setConfigs(confRes.data);
    setLoading(false);
  };

  const performSearch = async (query: string) => {
    setIsSearching(true);
    await fetchData(1, query);
    setIsSearching(false);
    setShowSearchDropdown(false);
    setHasSearched(true);
  };

  useEffect(() => {
    fetchData(1, searchQuery);
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSearchDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (!didMountSearch.current) {
      didMountSearch.current = true;
      return;
    }

    const delayDebounceFn = setTimeout(() => {
      if (searchQuery.trim().length >= 2) {
        performSearch(searchQuery);
      } else {
        setSearchResults([]);
        setShowSearchDropdown(false);
        fetchData(1, '');
      }
    }, 400);
    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery]);

  useEffect(() => {
    if (!didMountFilters.current) {
      didMountFilters.current = true;
      return;
    }
    fetchData(1, searchQuery.trim().length >= 2 ? searchQuery : '');
  }, [
    filterCustomerId,
    filterStatus,
    filterDateRange,
    filterExpiry,
    filterCustomerSuccess,
    filterSale,
    filterCustomerSupport,
    filterPhanKhuc,
    filterKhuVuc,
    filterKenhGuiTin,
    filterDuLieuInput
  ]);

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

  const filteredCustomers = customers;

  const getServiceSupportPairs = (services: any[] = []) => {
    const seen = new Set<string>();
    const pairs: { serviceType: string; support: string }[] = [];
    services.forEach((s: any) => {
      const serviceType = s.loai_dich_vu || 'Không rõ dịch vụ';
      const support = s.customer_support || 'Chưa gán SUP';
      const key = `${serviceType}|${support}`;
      if (!seen.has(key)) {
        seen.add(key);
        pairs.push({ serviceType, support });
      }
    });
    return pairs;
  };

  const handleExportExcel = async () => {
    try {
      const workbook = new ExcelJS.Workbook();
      
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

      const sheet2 = workbook.addWorksheet('Hợp đồng');
      const allContracts = filteredCustomers.flatMap(c => c.contracts || []);
      const contractKeys = allContracts.length > 0 ? Object.keys(allContracts[0]) : ['contract_id', 'customer_id', 'trang_thai'];
      sheet2.columns = contractKeys.map(k => ({ header: k, key: k, width: 20 }));
      allContracts.forEach(ct => sheet2.addRow(ct));
      sheet2.getRow(1).font = { bold: true };

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

  const isAnyFilterActive = !!(
    filterCustomerId ||
    filterStatus.length ||
    filterDateRange.start ||
    filterDateRange.end ||
    filterExpiry.length ||
    filterCustomerSuccess.length ||
    filterSale.length ||
    filterCustomerSupport.length ||
    filterPhanKhuc.length ||
    filterKhuVuc.length ||
    filterKenhGuiTin.length ||
    filterDuLieuInput.length
  );

  return (
    <>
      <div className="animate-fade-in">
        <div className="page-header">
          <div>
            <h1 style={{ fontSize: 'var(--text-2xl)', fontWeight: 800, color: 'var(--neutral-900)', margin: '0 0 4px 0', display: 'flex', alignItems: 'center', gap: '12px' }}>
              Tra cứu Khách hàng <span className="badge-custom" style={{ background: 'var(--primary-100)', color: 'var(--primary-800)', fontSize: '14px', verticalAlign: 'middle' }}>{totalRecords} KH</span>
            </h1>
            <p style={{ color: 'var(--neutral-500)', margin: 0, fontSize: '15px' }}>Tra cứu nhanh, xem hồ sơ 360 độ và quản lý tổng quan khách hàng</p>
          </div>
        </div>

        {/* Search & Actions Block */}
        <div className="card-container customer-toolbar-card" style={{ padding: 'var(--space-6)', marginBottom: 'var(--space-6)' }}>
          <div className="customer-toolbar" style={{ display: 'flex', gap: '16px', alignItems: 'center', flexWrap: 'wrap' }}>
            <div ref={searchRef} className="customer-search-box" style={{ position: 'relative', flex: 1, minWidth: '300px' }}>
              <div style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--neutral-400)' }}>
                <Search size={20} />
              </div>
              <input
                className="input-field w-full"
                placeholder="Tìm kiếm theo Tên công ty, ORG ID, KH ID..."
                style={{ padding: '12px 16px 12px 48px', fontSize: '15px', borderRadius: 'var(--radius-lg)' }}
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                onClick={() => { if (searchQuery.length >= 2) setShowSearchDropdown(true); }}
                onFocus={() => { if (searchQuery.length >= 2) setShowSearchDropdown(true); }}
              />
              {searchQuery && (
                <button 
                  style={{ position: 'absolute', right: '16px', top: '50%', transform: 'translateY(-50%)', background: 'transparent', border: 'none', cursor: 'pointer', padding: '4px' }}
                  onClick={() => { setSearchQuery(''); setSearchResults([]); setShowSearchDropdown(false); setFilterCustomerId(null); }}
                  title="Xóa tìm kiếm"
                >
                  <X size={18} color="var(--neutral-400)" />
                </button>
              )}

              {/* Dropdown Quick Search */}
              {showSearchDropdown && (
                <div className="animate-fade-in-up" style={{ position: 'absolute', top: 'calc(100% + 8px)', left: 0, right: 0, background: '#fff', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-lg)', border: '1px solid var(--neutral-200)', maxHeight: '500px', overflowY: 'auto', padding: '16px', zIndex: 100 }}>
                  {isSearching ? (
                    <div style={{ padding: '32px', textAlign: 'center', color: 'var(--neutral-500)' }}>Đang tìm kiếm...</div>
                  ) : searchResults.length === 0 ? (
                    <div style={{ padding: '32px', textAlign: 'center', color: 'var(--neutral-500)' }}>Không tìm thấy khách hàng hoặc dịch vụ phù hợp.</div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {searchResults.map(c => (
                        <div key={c.customer_id} className="search-result-card" style={{ padding: '16px', borderRadius: '12px', border: '1px solid var(--neutral-100)', cursor: 'pointer', background: 'var(--neutral-25)', transition: 'all 0.2s' }} onClick={() => { setFilterCustomerId(c.customer_id); setShowSearchDropdown(false); }}>
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
                                  <span><strong style={{ color: 'var(--neutral-500)', fontWeight: 500 }}>CS:</strong> <span style={{ color: 'var(--primary-600)', fontWeight: 600 }}>{c.customer_success || c.cs_in_charge || '--'}</span></span>
                                </div>
                              </div>
                            </div>
                            <button className="btn btn-secondary hover-bg-gray" style={{ flexShrink: 0, padding: '6px 12px', fontSize: '13px' }} onClick={(e) => { e.stopPropagation(); setActiveCustomer(c.customer_id); setShowSearchDropdown(false); }}>
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

            <button 
              className={`btn customer-action-btn ${showAdvancedFilters ? 'btn-primary' : 'btn-secondary'}`} 
              onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
              style={{ height: '44px' }}
            >
              <Filter size={18} />
              Bộ lọc nâng cao
              <ChevronDown size={16} style={{ transition: 'transform 0.2s', transform: showAdvancedFilters ? 'rotate(180deg)' : 'none' }} />
            </button>
            
            <button className="btn btn-secondary customer-action-btn" onClick={handleExportExcel} style={{ height: '44px' }}>
              <Download size={18} /> Xuất Excel
            </button>

            {isAnyFilterActive && (
              <button className="btn btn-danger customer-action-btn" onClick={clearAllFilters} style={{ height: '44px', background: 'transparent', border: 'none' }}>
                <FilterX size={18} /> Xóa lọc
              </button>
            )}
          </div>

          {/* Advanced Filters Panel */}
          {showAdvancedFilters && (
            <div className="animate-fade-in-up" style={{ marginTop: '24px', paddingTop: '24px', borderTop: '1px solid var(--neutral-200)', display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <div className="customer-filter-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
                <MultiSelectFilter label="Trạng thái" options={['Active', 'Inactive']} selected={filterStatus} toggle={(v) => toggleFilter(filterStatus, setFilterStatus, v)} />
                <MultiSelectFilter label="Thời gian hết hạn" options={['Còn < 15 ngày', 'Còn < 45 ngày', 'Đã hết hạn']} selected={filterExpiry} toggle={(v) => toggleFilter(filterExpiry, setFilterExpiry, v)} />
                <div>
                  <label className="label-custom" style={{ fontSize: '12px', fontWeight: 600, color: 'var(--neutral-600)', marginBottom: '4px', display: 'block' }}>Ngày tạo (Từ)</label>
                  <input type="date" className="input-field w-full" style={{ minHeight: '36px' }} value={filterDateRange.start} onChange={e => setFilterDateRange({...filterDateRange, start: e.target.value})} />
                </div>
                <div>
                  <label className="label-custom" style={{ fontSize: '12px', fontWeight: 600, color: 'var(--neutral-600)', marginBottom: '4px', display: 'block' }}>Ngày tạo (Đến)</label>
                  <input type="date" className="input-field w-full" style={{ minHeight: '36px' }} value={filterDateRange.end} onChange={e => setFilterDateRange({...filterDateRange, end: e.target.value})} />
                </div>
              </div>

              <div style={{ height: '1px', background: 'var(--neutral-100)' }} />

              <div className="customer-filter-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
                <MultiSelectFilter label="Customer Success (CS)" options={configs.customerSuccess || []} selected={filterCustomerSuccess} toggle={(v) => toggleFilter(filterCustomerSuccess, setFilterCustomerSuccess, v)} />
                <MultiSelectFilter label="Sale phụ trách" options={configs.tenSale || []} selected={filterSale} toggle={(v) => toggleFilter(filterSale, setFilterSale, v)} />
                <MultiSelectFilter label="Customer Support (SUP)" options={configs.customerSupport || []} selected={filterCustomerSupport} toggle={(v) => toggleFilter(filterCustomerSupport, setFilterCustomerSupport, v)} />
              </div>

              <div style={{ height: '1px', background: 'var(--neutral-100)' }} />

              <div className="customer-filter-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
                <MultiSelectFilter label="Phân khúc" options={configs.phanKhuc || []} selected={filterPhanKhuc} toggle={(v) => toggleFilter(filterPhanKhuc, setFilterPhanKhuc, v)} />
                <MultiSelectFilter label="Khu vực" options={configs.khuVuc || []} selected={filterKhuVuc} toggle={(v) => toggleFilter(filterKhuVuc, setFilterKhuVuc, v)} />
                <MultiSelectFilter label="Kênh gửi tin" options={configs.kenhGuiTin || []} selected={filterKenhGuiTin} toggle={(v) => toggleFilter(filterKenhGuiTin, setFilterKenhGuiTin, v)} />
                <MultiSelectFilter label="Dữ liệu Input" options={configs.duLieuInput || []} selected={filterDuLieuInput} toggle={(v) => toggleFilter(filterDuLieuInput, setFilterDuLieuInput, v)} />
              </div>
            </div>
          )}
        </div>

        {/* Data Table Block */}
        <div className="card-container" style={{ padding: 0, overflow: 'hidden' }}>
          <div className="customers-table-view" style={{ overflowX: 'auto' }}>
            <table className="custom-table" style={{ margin: 0, minWidth: '1100px' }}>
              <thead>
                <tr>
                  <th>Tên công ty / Mã KH</th>
                  <th>Org ID</th>
                  <th>Tài khoản</th>
                  <th>Bảo mật</th>
                  <th>Phụ trách (CS & Sale)</th>
                  <th>Dịch vụ / Support</th>
                  <th>Trạng thái</th>
                  <th style={{ textAlign: 'center' }}>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={8} style={{ textAlign: 'center', padding: '64px', color: 'var(--neutral-500)' }}>
                      <div style={{ display: 'inline-block', width: '28px', height: '28px', border: '3px solid var(--neutral-200)', borderTopColor: 'var(--primary-600)', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
                    </td>
                  </tr>
                ) : filteredCustomers.length === 0 ? (
                  <tr>
                    <td colSpan={8} style={{ textAlign: 'center', padding: '64px', color: 'var(--neutral-500)' }}>
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
                        <td style={{ color: 'var(--neutral-900)', fontWeight: 500 }}>{c.ten_tai_khoan || '--'}</td>
                        <td>
                          <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            {c.mat_khau ? (visiblePasswords[c.customer_id] ? c.mat_khau : '••••••••') : '--'}
                            {c.mat_khau && (
                              <button 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setVisiblePasswords(prev => ({...prev, [c.customer_id]: !prev[c.customer_id]}));
                                }}
                                style={{ background: 'var(--neutral-100)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: '4px', borderRadius: '4px' }}
                              >
                                {visiblePasswords[c.customer_id] ? <EyeOff size={14} color="var(--neutral-600)"/> : <Eye size={14} color="var(--neutral-600)"/>}
                              </button>
                            )}
                          </span>
                        </td>
                        <td>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            <div style={{ fontSize: '13px' }}><span style={{ color: 'var(--neutral-500)' }}>CS:</span> <span className="person-name-highlight">{c.customer_success || c.cs_in_charge || '--'}</span></div>
                            <div style={{ fontSize: '13px' }}><span style={{ color: 'var(--neutral-500)' }}>Sale:</span> <span style={{ fontWeight: 500, color: 'var(--neutral-800)' }}>{c.sale_phu_trach || c.sale_in_charge || '--'}</span></div>
                          </div>
                        </td>
                        <td>
                          {getServiceSupportPairs(c.services).length ? (
                            <div className="service-pair-grid compact">
                              {getServiceSupportPairs(c.services).slice(0, 6).map((p, idx) => (
                                <div className="service-pair-card" key={`${p.serviceType}-${p.support}-${idx}`}>
                                  <span className="service-name-highlight">{p.serviceType}</span>
                                  <strong className="person-name-highlight">{p.support}</strong>
                                </div>
                              ))}
                            </div>
                          ) : '--'}
                        </td>
                        <td>
                          <StatusBadge status={c.trang_thai === 'Active' ? 'Hoạt động' : 'Tạm ngưng'} />
                        </td>
                        <td style={{ textAlign: 'center' }} onClick={(e) => e.stopPropagation()}>
                          <button 
                            onClick={() => setActiveCustomer(c.customer_id)}
                            className="btn btn-secondary hover-bg-gray" 
                            style={{ padding: '6px 12px', fontSize: '13px', background: '#fff' }}
                          >
                            Xem 360
                          </button>
                        </td>
                      </tr>
                      
                      {/* Expandable Services Row */}
                      {expandedCustomer === c.customer_id && (
                        <tr>
                          <td colSpan={8} style={{ padding: '0', borderBottom: '1px solid var(--neutral-200)' }}>
                            <div className="animate-fade-in-down" style={{ background: 'var(--neutral-25)', padding: '24px 32px', borderTop: '1px dashed var(--primary-200)' }}>
                              <h4 style={{ margin: '0 0 16px 0', fontSize: '14px', color: 'var(--primary-700)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <FileText size={16} /> Chi tiết Dịch vụ & Support phụ trách
                              </h4>
                          
                          {c.services && c.services.length > 0 ? (
                            <div className="group-detail-grid">
                              {c.services.map((s: any) => (
                                <div key={s.service_id} className="group-detail-card">
                                  <div className="group-detail-card-header">
                                    <div>
                                      <div className="service-name-highlight">{s.loai_dich_vu || 'Dịch vụ'}</div>
                                      <div className="group-count-note">{s.service_id || s.contract_id || '--'}</div>
                                    </div>
                                    <StatusBadge status={s.trang_thai} />
                                  </div>
                                  <div className="group-summary-grid">
                                    <div><span>CS</span><strong>{c.customer_success || c.cs_in_charge || '--'}</strong></div>
                                    <div><span>SUP</span><strong className="person-name-highlight">{s.customer_support || '--'}</strong></div>
                                    <div><span>Brand/OA</span><strong>{s.brand_name_oa || '--'}</strong></div>
                                    <div><span>CP Name</span><strong>{s.cp_name_code || '--'}</strong></div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div style={{ padding: '16px', textAlign: 'center', color: 'var(--neutral-500)', background: '#fff', borderRadius: 'var(--radius-md)', border: '1px dashed var(--neutral-300)' }}>
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

          <div className="customers-mobile-list">
            {loading ? (
              <div style={{ padding: '32px', textAlign: 'center', color: 'var(--neutral-500)' }}>
                <div style={{ display: 'inline-block', width: '28px', height: '28px', border: '3px solid var(--neutral-200)', borderTopColor: 'var(--primary-600)', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
              </div>
            ) : filteredCustomers.length === 0 ? (
              <div style={{ padding: '32px 20px', textAlign: 'center', color: 'var(--neutral-500)' }}>
                Không có khách hàng nào phù hợp với bộ lọc.
              </div>
            ) : (
              filteredCustomers.map((c) => {
                const isExpanded = expandedCustomer === c.customer_id;
                return (
                  <article key={c.customer_id} className="customer-mobile-item">
                    <button
                      type="button"
                      className="customer-mobile-summary"
                      onClick={() => setExpandedCustomer(isExpanded ? null : c.customer_id)}
                    >
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontWeight: 700, color: 'var(--neutral-900)', lineHeight: 1.35 }}>{c.ten_cong_ty || '--'}</div>
                        <div style={{ fontSize: '12px', color: 'var(--neutral-500)', marginTop: '4px' }}>
                          {c.customer_id} {c.org_id ? `- Org ${c.org_id}` : ''}
                        </div>
                      </div>
                      <ChevronRight size={18} style={{ flexShrink: 0, color: 'var(--neutral-500)', transform: isExpanded ? 'rotate(90deg)' : 'none', transition: 'transform 0.2s' }} />
                    </button>

                    <div className="customer-mobile-meta">
                      <div><span>CS</span><strong>{c.customer_success || c.cs_in_charge || '--'}</strong></div>
                      <div><span>Sale</span><strong>{c.sale_phu_trach || c.sale_in_charge || '--'}</strong></div>
                      <div><span>Dịch vụ</span><strong>{c.total_services || 0}</strong></div>
                    </div>

                    {getServiceSupportPairs(c.services).length > 0 && (
                      <div className="customer-mobile-services" style={{ borderTop: '1px dashed var(--neutral-200)' }}>
                        <div className="service-pair-grid">
                          {getServiceSupportPairs(c.services).map((p, idx) => (
                            <div className="service-pair-card" key={`${p.serviceType}-${p.support}-${idx}`}>
                              <span className="service-name-highlight">{p.serviceType}</span>
                              <strong className="person-name-highlight">{p.support}</strong>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="customer-mobile-footer">
                      <StatusBadge status={c.trang_thai === 'Active' ? 'Hoạt động' : 'Tạm ngưng'} />
                      <button
                        className="btn btn-secondary"
                        style={{ padding: '7px 12px', fontSize: '13px' }}
                        onClick={() => setActiveCustomer(c.customer_id)}
                      >
                        Xem 360
                      </button>
                    </div>

                    {isExpanded && (
                      <div className="customer-mobile-services">
                        <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--primary-700)', marginBottom: '10px' }}>
                          Dịch vụ của khách hàng
                        </div>
                        {c.services && c.services.length > 0 ? (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            {c.services.map((s: any) => (
                              <div key={s.service_id} className="customer-mobile-service-row">
                                <div style={{ display: 'flex', justifyContent: 'space-between', gap: '8px', alignItems: 'flex-start' }}>
                                  <div style={{ minWidth: 0 }}>
                                    <div className="service-name-highlight">{s.loai_dich_vu || 'Dịch vụ'}</div>
                                    <div style={{ fontSize: '12px', color: 'var(--neutral-500)', marginTop: '3px', overflowWrap: 'anywhere' }}>
                                      {s.brand_name_oa || s.cp_name_code || s.service_id || '--'}
                                    </div>
                                  </div>
                                  <StatusBadge status={s.trang_thai} />
                                </div>
                                <div style={{ marginTop: '8px', fontSize: '12px', color: 'var(--neutral-600)' }}>
                                  SUP: <strong className="person-name-highlight">{s.customer_support || '--'}</strong> · CS: <strong className="person-name-highlight">{c.customer_success || c.cs_in_charge || '--'}</strong>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div style={{ padding: '12px', color: 'var(--neutral-500)', border: '1px dashed var(--neutral-300)', borderRadius: 'var(--radius-sm)' }}>
                            Khách hàng chưa có dịch vụ nào
                          </div>
                        )}
                      </div>
                    )}
                  </article>
                );
              })
            )}
          </div>

          <Pagination 
            currentPage={currentPage} 
            totalPages={totalPages} 
            totalItems={totalRecords} 
            onPageChange={(page) => fetchData(page, searchQuery)} 
          />
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
