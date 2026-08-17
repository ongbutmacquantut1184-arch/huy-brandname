"use client";

import React, { useEffect, useState, useRef } from 'react';
import { getServices, createService, updateServiceInfo, getDropdownConfigs, getCustomers, getContractsByCustomerId, getBrands, getCps } from '@/lib/cx-actions';
import { Search as SearchIcon, Filter, CheckSquare, Square, ChevronDown, Plus, Pencil, RefreshCw } from 'lucide-react';
import Pagination from '@/components/ui/Pagination';
import StatusBadge from '@/components/ui/StatusBadge';
import Modal from '@/components/ui/Modal';
import SkeletonLoader from '@/components/ui/SkeletonLoader';
import { useAuth } from '@/lib/AuthContext';

export default function ServicesPage() {
  const [services, setServices] = useState<any[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const [customers, setCustomers] = useState<any[]>([]);
  const [customerContracts, setCustomerContracts] = useState<any[]>([]);
  const [lookups, setLookups] = useState<any>({});
  const [brandsList, setBrandsList] = useState<any[]>([]);
  const [cpsList, setCpsList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { userEmail } = useAuth();

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string[]>([]);
  const [filterType, setFilterType] = useState<string[]>([]);
  const [filterSUP, setFilterSUP] = useState<string[]>([]);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const didMountSearch = useRef(false);
  const didMountFilters = useRef(false);

  // Accordion
  const [expandedRow, setExpandedRow] = useState<string | null>(null);

  // Modals
  const [activeModal, setActiveModal] = useState<'add' | 'edit' | 'renew' | 'view' | null>(null);
  const [selectedService, setSelectedService] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    customerId: '', contractId: '', loaiDichVu: '', trangThai: 'Active', cpNameCode: '', brandNameOA: '', 
    thoiHanBrand: '', dauSo: '', cuPhap: '', quocGia: '', ketNoiAPIGateway: '', ketNoiSMPP: '', ketNoiAPIGapOne: '', 
    ketNoiViZCA: '', ketNoiHeThongKH: '', tenService: '', supPhuTrach: '', ngayBatDau: '', ngayHetHan: '', ghiChu: '', 
    actorEmail: '', channel: '', usageMethod: '', templateRegistrationMethod: 'Thủ công qua file'
  });

  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setOpenDropdown(null);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const getCurrentFilters = () => ({
    statuses: filterStatus,
    types: filterType,
    support: filterSUP,
  });

  async function fetchData(page = 1, query = '') {
    setLoading(true);
    const [res, configsRes, custRes, brandsRes, cpsRes] = await Promise.all([
      getServices(page, 20, query, getCurrentFilters()),
      getDropdownConfigs(),
      getCustomers(),
      getBrands(),
      getCps()
    ]);
    
    if (configsRes.success && configsRes.data) setLookups(configsRes.data);
    if (custRes.success && custRes.data) setCustomers(custRes.data);
    if (brandsRes.success && brandsRes.data) setBrandsList(brandsRes.data);
    if (cpsRes.success && cpsRes.data) setCpsList(cpsRes.data);

    if (res.success && res.data) {
      setServices(res.data);
      setTotalPages(res.totalPages || 1);
      setTotalRecords(res.totalRecords || 0);
      setCurrentPage(res.currentPage || 1);
      
      const params = new URLSearchParams(window.location.search);
      const editId = params.get('edit');
      if (editId) {
        const serviceToEdit = res.data.flatMap((group: any) => group.services || []).find((s: any) => s.service_id === editId);
        if (serviceToEdit) {
          setSelectedService(serviceToEdit);
          setFormData({
            customerId: serviceToEdit.customer_id || '', contractId: serviceToEdit.contract_id || '', loaiDichVu: serviceToEdit.loai_dich_vu || '', trangThai: serviceToEdit.trang_thai || 'Active', cpNameCode: serviceToEdit.cp_name_code || '', brandNameOA: serviceToEdit.brand_name_oa || '', thoiHanBrand: serviceToEdit.thoi_han_brand || '', dauSo: serviceToEdit.dau_so || '', cuPhap: serviceToEdit.cu_phap || '', quocGia: serviceToEdit.quoc_gia || '', ketNoiAPIGateway: serviceToEdit.ket_noi_api_gateway || '', ketNoiSMPP: serviceToEdit.ket_noi_smpp || '', ketNoiAPIGapOne: serviceToEdit.ket_noi_api_gap_one || '', ketNoiViZCA: serviceToEdit.ket_noi_vi_zca || '', ketNoiHeThongKH: serviceToEdit.ket_noi_he_thong_kh || '', tenService: serviceToEdit.ten_service || '', supPhuTrach: serviceToEdit.customer_support || '', ngayBatDau: serviceToEdit.ngay_bat_dau || '', ngayHetHan: serviceToEdit.ngay_het_han || '', ghiChu: serviceToEdit.ghi_chu || '', actorEmail: serviceToEdit.created_by || '', channel: serviceToEdit.channel || '', usageMethod: serviceToEdit.usage_method || '', templateRegistrationMethod: serviceToEdit.template_registration_method || 'Thủ công qua file'
          });
          setActiveModal('edit');
          window.history.replaceState({}, document.title, window.location.pathname);
        }
      }
    }
    setLoading(false);
  }

  useEffect(() => {
    fetchData(1, searchQuery);
  }, []);

  useEffect(() => {
    if (!didMountSearch.current) {
      didMountSearch.current = true;
      return;
    }

    const delayDebounceFn = setTimeout(() => {
      fetchData(1, searchQuery);
    }, 400);
    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery]);

  useEffect(() => {
    if (!didMountFilters.current) {
      didMountFilters.current = true;
      return;
    }
    fetchData(1, searchQuery);
  }, [filterStatus, filterType, filterSUP]);

  useEffect(() => {
    if (formData.customerId) {
      getContractsByCustomerId(formData.customerId).then(res => {
        if (res.success && res.data) setCustomerContracts(res.data);
      });
    } else {
      setCustomerContracts([]);
    }
  }, [formData.customerId]);

  const toggleFilter = (list: string[], setList: (v: string[]) => void, item: string) => {
    if (list.includes(item)) setList(list.filter(i => i !== item));
    else setList([...list, item]);
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '--';
    const parts = dateStr.split('-');
    if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`;
    return dateStr;
  };

  const uniqueStatus = ['Active', 'Expired', 'Pending', 'Cancelled'];
  const uniqueTypes = lookups.loaiDichVu || [];
  const uniqueSUP = lookups.customerSupport || [];

  const serviceGroups = services;

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

  const openAddModal = () => {
    setFormData({
      customerId: '', contractId: '', loaiDichVu: '', trangThai: 'Active', cpNameCode: '', brandNameOA: '', 
      thoiHanBrand: '', dauSo: '', cuPhap: '', quocGia: '', ketNoiAPIGateway: '', ketNoiSMPP: '', ketNoiAPIGapOne: '', 
      ketNoiViZCA: '', ketNoiHeThongKH: '', tenService: '', supPhuTrach: '', ngayBatDau: '', ngayHetHan: '', ghiChu: '', actorEmail: userEmail || '',
      channel: '', usageMethod: '', templateRegistrationMethod: 'Thủ công qua file'
    });
    setActiveModal('add');
  };

  const openEditModal = (s: any) => {
    setSelectedService(s);
    setFormData({
      customerId: s.customer_id || '', contractId: s.contract_id || '', loaiDichVu: s.loai_dich_vu || '', trangThai: s.trang_thai || 'Active', cpNameCode: s.cp_name_code || '', brandNameOA: s.brand_name_oa || '', thoiHanBrand: s.thoi_han_brand || '', dauSo: s.dau_so || '', cuPhap: s.cu_phap || '', quocGia: s.quoc_gia || '', ketNoiAPIGateway: s.ket_noi_api_gateway || '', ketNoiSMPP: s.ket_noi_smpp || '', ketNoiAPIGapOne: s.ket_noi_api_gap_one || '', ketNoiViZCA: s.ket_noi_vi_zca || '', ketNoiHeThongKH: s.ket_noi_he_thong_kh || '', tenService: s.ten_service || '', supPhuTrach: s.customer_support || '', ngayBatDau: s.ngay_bat_dau || '', ngayHetHan: s.ngay_het_han || '', ghiChu: s.ghi_chu || '', actorEmail: s.created_by || '', channel: s.channel || '', usageMethod: s.usage_method || '', templateRegistrationMethod: s.template_registration_method || 'Thủ công qua file'
    });
    setActiveModal('edit');
  };

  const openRenewModal = (s: any) => {
    setSelectedService(s);
    setFormData({
      customerId: s.customer_id || '', contractId: s.contract_id || '', loaiDichVu: s.loai_dich_vu || '', trangThai: 'Active', cpNameCode: s.cp_name_code || '', brandNameOA: s.brand_name_oa || '', thoiHanBrand: '', dauSo: s.dau_so || '', cuPhap: s.cu_phap || '', quocGia: s.quoc_gia || '', ketNoiAPIGateway: s.ket_noi_api_gateway || '', ketNoiSMPP: s.ket_noi_smpp || '', ketNoiAPIGapOne: s.ket_noi_api_gap_one || '', ketNoiViZCA: s.ket_noi_vi_zca || '', ketNoiHeThongKH: s.ket_noi_he_thong_kh || '', tenService: s.ten_service || '', supPhuTrach: s.customer_support || '', ngayBatDau: s.ngay_het_han || '', ngayHetHan: '', ghiChu: s.ghi_chu || '', actorEmail: userEmail || '', channel: s.channel || '', usageMethod: s.usage_method || '', templateRegistrationMethod: s.template_registration_method || 'Thủ công qua file'
    });
    setActiveModal('renew');
  };

  const toggleExpand = (customerId: string) => {
    if (expandedRow === customerId) setExpandedRow(null);
    else setExpandedRow(customerId);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      if (activeModal === 'add') {
        const res = await createService(formData);
        if (!res.success) throw new Error(res.error);
      } else if (activeModal === 'edit') {
        const payload = { ...formData, serviceId: selectedService.service_id };
        const res = await updateServiceInfo(payload);
        if (!res.success) throw new Error(res.error);
      } else if (activeModal === 'renew') {
        const { renewContract } = await import('@/lib/cx-actions');
        const payload = {
          type: 'service', targetId: selectedService.service_id, customerId: formData.customerId, ngayBatDauMoi: formData.ngayBatDau, ngayKetThucMoi: formData.ngayHetHan, actorEmail: userEmail, ghiChu: formData.ghiChu
        };
        const res = await renewContract(payload);
        if (!res.success) throw new Error(res.error);
      }
      await fetchData(currentPage, searchQuery);
      setActiveModal(null);
    } catch (err: any) {
      alert("Lỗi: " + err.message);
    }
    setIsSubmitting(false);
  };

  return (
    <>
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div className="page-header">
        <div>
          <h1 style={{ fontSize: 'var(--text-2xl)', fontWeight: 800, color: 'var(--neutral-900)', margin: '0 0 4px 0', display: 'flex', alignItems: 'center', gap: '12px' }}>
            Quản lý Dịch vụ <span className="badge-custom" style={{ background: 'var(--primary-100)', color: 'var(--primary-800)', fontSize: '14px', verticalAlign: 'middle' }}>{totalRecords} KH</span>
          </h1>
        </div>
        <button className="btn btn-primary" onClick={openAddModal} style={{ padding: '10px 20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Plus size={18} /> Thêm mới
        </button>
      </div>

      <div className="card-container" style={{ padding: 'var(--space-6)', marginBottom: 'var(--space-6)', display: 'flex', flexWrap: 'wrap', gap: '16px', alignItems: 'flex-end', zIndex: 10, position: 'relative', overflow: 'visible' }} ref={dropdownRef}>
        <div style={{ flex: '1 1 200px' }}>
          <label className="label-custom" style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '8px' }}>
            <Filter size={14} style={{ display: 'inline', marginBottom: '-2px', marginRight: '4px', color: 'var(--primary-600)' }}/> Tìm kiếm
          </label>
          <div style={{ position: 'relative' }}>
            <SearchIcon size={16} style={{ position: 'absolute', left: '12px', top: '13px', color: 'var(--neutral-400)', zIndex: 5 }} />
            <input 
              type="text" 
              placeholder="Mã Dịch vụ, Khách hàng, Hợp đồng, Brand..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input-field w-full"
              style={{ paddingLeft: '36px', height: '42px' }}
            />
          </div>
        </div>

        <div style={{ position: 'relative', flex: '1 1 180px' }}>
          <label className="label-custom" style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '8px' }}>Trạng thái</label>
          <div className="input-field w-full" style={{ height: '42px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', background: '#FFFFFF' }} onClick={() => setOpenDropdown(openDropdown === 'status' ? null : 'status')}>
            <span style={{ fontSize: '14px', color: filterStatus.length ? 'var(--neutral-900)' : 'var(--neutral-500)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {filterStatus.length === 0 ? 'Tất cả trạng thái' : filterStatus.join(', ')}
            </span>
            <ChevronDown size={16} style={{ color: 'var(--neutral-500)' }} />
          </div>
          {openDropdown === 'status' && (
            <div className="custom-dropdown">
              {uniqueStatus.map((s: string) => (
                <div key={s} className="dropdown-item" onClick={() => toggleFilter(filterStatus, setFilterStatus, s)} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {filterStatus.includes(s) ? <CheckSquare size={16} style={{ color: 'var(--primary-600)' }} /> : <Square size={16} style={{ color: 'var(--neutral-400)' }} />}
                  {s}
                </div>
              ))}
            </div>
          )}
        </div>

        <div style={{ position: 'relative', flex: '1 1 180px' }}>
          <label className="label-custom" style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '8px' }}>Loại Dịch vụ</label>
          <div className="input-field w-full" style={{ height: '42px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', background: '#FFFFFF' }} onClick={() => setOpenDropdown(openDropdown === 'type' ? null : 'type')}>
            <span style={{ fontSize: '14px', color: filterType.length ? 'var(--neutral-900)' : 'var(--neutral-500)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {filterType.length === 0 ? 'Tất cả loại DV' : filterType.join(', ')}
            </span>
            <ChevronDown size={16} style={{ color: 'var(--neutral-500)' }} />
          </div>
          {openDropdown === 'type' && (
            <div className="custom-dropdown">
              {uniqueTypes.map((s: string) => (
                <div key={s} className="dropdown-item" onClick={() => toggleFilter(filterType, setFilterType, s)} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {filterType.includes(s) ? <CheckSquare size={16} style={{ color: 'var(--primary-600)' }} /> : <Square size={16} style={{ color: 'var(--neutral-400)' }} />}
                  {s}
                </div>
              ))}
            </div>
          )}
        </div>

        <div style={{ position: 'relative', flex: '1 1 180px' }}>
          <label className="label-custom" style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '8px' }}>SUP Phụ trách</label>
          <div className="input-field w-full" style={{ height: '42px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', background: '#FFFFFF' }} onClick={() => setOpenDropdown(openDropdown === 'sup' ? null : 'sup')}>
            <span style={{ fontSize: '14px', color: filterSUP.length ? 'var(--neutral-900)' : 'var(--neutral-500)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {filterSUP.length === 0 ? 'Tất cả SUP' : filterSUP.join(', ')}
            </span>
            <ChevronDown size={16} style={{ color: 'var(--neutral-500)' }} />
          </div>
          {openDropdown === 'sup' && (
            <div className="custom-dropdown">
              {uniqueSUP.map((s: string) => (
                <div key={s} className="dropdown-item" onClick={() => toggleFilter(filterSUP, setFilterSUP, s)} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {filterSUP.includes(s) ? <CheckSquare size={16} style={{ color: 'var(--primary-600)' }} /> : <Square size={16} style={{ color: 'var(--neutral-400)' }} />}
                  {s}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="card-container" style={{ padding: 0, overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: 'var(--space-8)' }}>
            <SkeletonLoader rows={8} />
          </div>
        ) : serviceGroups.length === 0 ? (
          <div style={{ padding: '60px 40px', textAlign: 'center', color: 'var(--neutral-500)' }}>Không có dữ liệu dịch vụ nào khớp với bộ lọc.</div>
        ) : (
          <>
          <div className="services-table-view" style={{ overflowX: 'auto' }}>
            <table className="custom-table" style={{ margin: 0, minWidth: '900px' }}>
              <thead>
                <tr>
                  <th>Công ty</th>
                  <th>CS</th>
                  <th>Số dịch vụ</th>
                  <th>Loại dịch vụ / SUP</th>
                  <th>Trạng thái tổng quan</th>
                  <th>Sale</th>
                </tr>
              </thead>
              <tbody>
                {serviceGroups.map(group => {
                  const isExpanded = expandedRow === group.customer_id;
                  const servicePairs = getServiceSupportPairs(group.services);
                  return (
                  <React.Fragment key={group.customer_id}>
                    <tr className="row-hover" style={{ cursor: 'pointer', background: isExpanded ? 'var(--primary-50)' : 'transparent' }} onClick={() => toggleExpand(group.customer_id)}>
                      <td>
                        <div style={{ color: 'var(--neutral-900)', fontWeight: 700 }}>{group.ten_cong_ty || '--'}</div>
                        <div style={{ color: 'var(--neutral-500)', fontSize: '12px', marginTop: 4 }}>{group.customer_id}</div>
                      </td>
                      <td><span className="person-name-highlight">{group.customer_success || '--'}</span></td>
                      <td>
                        <div className="group-count-value">{group.total_services}</div>
                        <div className="group-count-note">{group.active_services} active / {group.pending_services} pending</div>
                      </td>
                      <td>
                        {servicePairs.length ? (
                          <div className="service-pair-grid compact">
                            {servicePairs.slice(0, 6).map((p, idx) => (
                              <div className="service-pair-card" key={`${p.serviceType}-${p.support}-${idx}`}>
                                <span className="service-name-highlight">{p.serviceType}</span>
                                <strong className="person-name-highlight">{p.support}</strong>
                              </div>
                            ))}
                          </div>
                        ) : '--'}
                      </td>
                      <td>
                        <StatusBadge status={group.active_services > 0 ? 'Active' : group.pending_services > 0 ? 'Pending' : 'Inactive'} />
                      </td>
                      <td>{group.sale_phu_trach || '--'}</td>
                    </tr>
                    {isExpanded && (
                      <tr>
                        <td colSpan={6} style={{ background: 'var(--neutral-25)', padding: '0', borderBottom: '1px solid var(--neutral-200)' }}>
                          <div className="animate-fade-in-down" style={{ padding: '24px 32px', borderTop: '1px dashed var(--primary-200)' }}>
                            <h4 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--primary-700)', margin: '0 0 16px 0' }}>Dịch vụ của khách hàng</h4>
                            <div className="group-detail-grid">
                              {group.services.map((s: any) => (
                                <div key={s.service_id} className="group-detail-card">
                                  <div className="group-detail-card-header">
                                    <div>
                                      <div className="service-name-highlight">{s.loai_dich_vu || '--'}</div>
                                      <div className="group-count-note">{s.service_id}</div>
                                    </div>
                                    <StatusBadge status={s.trang_thai} />
                                  </div>
                                  <div className="group-summary-grid">
                                    <div><span>CS</span><strong>{group.customer_success || '--'}</strong></div>
                                    <div><span>SUP</span><strong className="person-name-highlight">{s.customer_support || '--'}</strong></div>
                                    <div><span>Brand/OA</span><strong>{s.brand_name_oa || '--'}</strong></div>
                                    <div><span>CP Name</span><strong>{s.cp_name_code || '--'}</strong></div>
                                    <div><span>Bắt đầu</span><strong>{formatDate(s.ngay_bat_dau)}</strong></div>
                                    <div><span>Hết hạn</span><strong>{formatDate(s.ngay_het_han)}</strong></div>
                                  </div>
                                  <div className="group-card-actions">
                                    <button className="btn btn-secondary hover-bg-gray" style={{ padding: '6px 10px', fontSize: '12px' }} onClick={(e) => { e.stopPropagation(); openEditModal(s); }} title="Chỉnh sửa">
                                      <Pencil size={14} /> Sửa
                                    </button>
                                    <button className="btn btn-secondary hover-bg-gray" style={{ padding: '6px 10px', fontSize: '12px' }} onClick={(e) => { e.stopPropagation(); openRenewModal(s); }} title="Gia hạn dịch vụ">
                                      <RefreshCw size={14} /> Gia hạn
                                    </button>
                                  </div>
                                </div>
                              ))}
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
          <div className="services-mobile-list">
            {serviceGroups.map(group => {
              const isExpanded = expandedRow === group.customer_id;
              return (
                <article key={group.customer_id} className="customer-mobile-item">
                  <button type="button" className="customer-mobile-summary" onClick={() => toggleExpand(group.customer_id)}>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontWeight: 700, color: 'var(--neutral-900)', lineHeight: 1.35 }}>{group.ten_cong_ty || '--'}</div>
                      <div style={{ fontSize: 12, color: 'var(--neutral-500)', marginTop: 4 }}>{group.customer_id} {group.org_id ? `- Org ${group.org_id}` : ''}</div>
                    </div>
                    <ChevronDown size={18} style={{ flexShrink: 0, color: 'var(--neutral-500)', transform: isExpanded ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
                  </button>
                  <div className="customer-mobile-meta">
                    <div><span>CS</span><strong>{group.customer_success || '--'}</strong></div>
                    <div><span>Dịch vụ</span><strong>{group.total_services}</strong></div>
                    <div><span>Active</span><strong>{group.active_services}</strong></div>
                  </div>
                  <div className="customer-mobile-services" style={{ borderTop: '1px dashed var(--neutral-200)' }}>
                    <div className="service-pair-grid">
                      {getServiceSupportPairs(group.services).map((p, idx) => (
                        <div className="service-pair-card" key={`${p.serviceType}-${p.support}-${idx}`}>
                          <span className="service-name-highlight">{p.serviceType}</span>
                          <strong className="person-name-highlight">{p.support}</strong>
                        </div>
                      ))}
                    </div>
                  </div>
                  {isExpanded && (
                    <div className="customer-mobile-services">
                      {group.services.map((s: any) => (
                        <div key={s.service_id} className="customer-mobile-service-row">
                          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, alignItems: 'flex-start' }}>
                            <div style={{ minWidth: 0 }}>
                              <div className="service-name-highlight">{s.loai_dich_vu || 'Dịch vụ'}</div>
                              <div style={{ fontSize: 12, color: 'var(--neutral-500)', marginTop: 3, overflowWrap: 'anywhere' }}>{s.brand_name_oa || s.cp_name_code || s.service_id || '--'}</div>
                            </div>
                            <StatusBadge status={s.trang_thai} />
                          </div>
                          <div style={{ marginTop: 8, fontSize: 12, color: 'var(--neutral-600)' }}>
                            SUP: <strong className="person-name-highlight">{s.customer_support || '--'}</strong> · CS: <strong className="person-name-highlight">{group.customer_success || '--'}</strong> · Hết hạn: <strong style={{ color: 'var(--neutral-900)' }}>{formatDate(s.ngay_het_han)}</strong>
                          </div>
                          <div style={{ marginTop: 10, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                            <button className="btn btn-secondary" style={{ padding: '7px 10px', fontSize: 12, justifyContent: 'center' }} onClick={() => openEditModal(s)}>
                              <Pencil size={14} /> Sửa
                            </button>
                            <button className="btn btn-secondary" style={{ padding: '7px 10px', fontSize: 12, justifyContent: 'center' }} onClick={() => openRenewModal(s)}>
                              <RefreshCw size={14} /> Gia hạn
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </article>
              );
            })}
          </div>
          </>
        )}
        <Pagination 
          currentPage={currentPage} 
          totalPages={totalPages} 
          totalItems={totalRecords} 
          onPageChange={(page) => fetchData(page, searchQuery)} 
        />
      </div>
    </div>

    {/* Modals */}
    <Modal
      isOpen={['add', 'edit', 'renew'].includes(activeModal as string)}
      onClose={() => setActiveModal(null)}
      title={activeModal === 'add' ? 'Thêm mới Dịch vụ' : activeModal === 'renew' ? 'Gia hạn Dịch vụ' : 'Chỉnh sửa Dịch vụ'}
      width="800px"
      footer={
        <div style={{ display: 'flex', gap: '12px', width: '100%' }}>
          <button type="button" onClick={() => setActiveModal(null)} className="btn btn-secondary hover-bg-gray" style={{ flex: 1, padding: '10px' }}>Hủy</button>
          <button type="submit" form="serviceForm" disabled={isSubmitting} className="btn btn-primary" style={{ flex: 1, padding: '10px' }}>
            {isSubmitting ? 'Đang lưu...' : activeModal === 'renew' ? 'Lưu Gia hạn' : 'Lưu Dịch vụ'}
          </button>
        </div>
      }
    >
      <form id="serviceForm" onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div style={{ background: 'var(--neutral-50)', padding: '20px', borderRadius: '8px', border: '1px solid var(--neutral-200)' }}>
          <h3 style={{ fontSize: '15px', fontWeight: 600, color: 'var(--neutral-800)', marginBottom: '16px', borderBottom: '1px solid var(--neutral-200)', paddingBottom: '8px' }}>1. Thông tin chung</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
            <div>
              <label className="label-custom">Khách hàng <span className="text-error-600">*</span></label>
              <select required className="input-field w-full" value={formData.customerId} onChange={e => setFormData({...formData, customerId: e.target.value, contractId: ''})} disabled={activeModal === 'renew'}>
                <option value="">-- Chọn Khách hàng --</option>
                {customers.map(c => <option key={c.customer_id} value={c.customer_id}>{c.customer_id} - {c.ten_cong_ty}</option>)}
              </select>
            </div>
            <div>
              <label className="label-custom">HĐ/PO liên kết</label>
              <select className="input-field w-full" value={formData.contractId} onChange={e => setFormData({...formData, contractId: e.target.value})}>
                <option value="">-- Trống --</option>
                {customerContracts.map(c => <option key={c.contract_id} value={c.contract_id}>{c.contract_id} (HĐ: {c.so_hop_dong || 'N/A'})</option>)}
              </select>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px', marginBottom: '16px' }}>
            <div>
              <label className="label-custom">Loại Dịch vụ <span className="text-error-600">*</span></label>
              <select required className="input-field w-full" value={formData.loaiDichVu} onChange={e => setFormData({...formData, loaiDichVu: e.target.value})}>
                <option value="">-- Chọn Loại DV --</option>
                {(lookups.loaiDichVu || []).map((t: string) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="label-custom">SUP Phụ trách</label>
              <select className="input-field w-full" value={formData.supPhuTrach} onChange={e => setFormData({...formData, supPhuTrach: e.target.value})}>
                <option value="">-- Chọn SUP --</option>
                {(lookups.customerSupport || []).map((sup: string) => <option key={sup} value={sup}>{sup}</option>)}
              </select>
            </div>
            <div>
              <label className="label-custom">Trạng thái</label>
              <select className="input-field w-full" value={formData.trangThai} onChange={e => setFormData({...formData, trangThai: e.target.value})}>
                <option value="Active">Active</option>
                <option value="Pending">Pending</option>
                <option value="Expired">Expired</option>
                <option value="Cancelled">Cancelled</option>
              </select>
            </div>
          </div>
          <div>
            <label className="label-custom">Tên Dịch vụ</label>
            <input className="input-field w-full" value={formData.tenService} onChange={e => setFormData({...formData, tenService: e.target.value})} />
          </div>
        </div>

        <div style={{ background: 'var(--neutral-50)', padding: '20px', borderRadius: '8px', border: '1px solid var(--neutral-200)' }}>
          <h3 style={{ fontSize: '15px', fontWeight: 600, color: 'var(--neutral-800)', marginBottom: '16px', borderBottom: '1px solid var(--neutral-200)', paddingBottom: '8px' }}>2. Chi tiết nghiệp vụ</h3>
          <datalist id="cps-list">{cpsList.map(cp => <option key={cp.id} value={cp.name} />)}</datalist>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px', marginBottom: '16px' }}>
            {(formData.loaiDichVu === 'SMS' || formData.loaiDichVu === 'Khác' || !formData.loaiDichVu) && (
              <div><label className="label-custom">CP Name</label><input className="input-field w-full" list="cps-list" value={formData.cpNameCode} onChange={e => setFormData({...formData, cpNameCode: e.target.value})} placeholder="Chọn hoặc nhập mới" /></div>
            )}
            <div><label className="label-custom">Brand/OA (Có thể nhập nhiều)</label><input className="input-field w-full" value={formData.brandNameOA} onChange={e => setFormData({...formData, brandNameOA: e.target.value})} placeholder="Vd: BrandA, BrandB, OA1" /></div>
            {(formData.loaiDichVu === 'SMS' || formData.loaiDichVu === 'ZBS' || formData.loaiDichVu === 'Khác' || !formData.loaiDichVu) && (
              <div>
                <label className="label-custom">Kênh gửi tin</label>
                <select className="input-field w-full" value={formData.channel} onChange={e => setFormData({...formData, channel: e.target.value})}>
                  <option value="">-- Chọn kênh --</option>
                  {formData.loaiDichVu === 'SMS' && <><option value="SMS CSKH">SMS CSKH</option><option value="SMS QC">SMS QC</option><option value="SMS Full">SMS Full</option></>}
                  {formData.loaiDichVu === 'ZBS' && <><option value="ZBS SĐT">ZBS SĐT</option><option value="ZBS UID">ZBS UID</option><option value="ZBS Full">ZBS Full</option></>}
                  {formData.loaiDichVu !== 'SMS' && formData.loaiDichVu !== 'ZBS' && (lookups.kenhGuiTin || []).map((k: string) => <option key={k} value={k}>{k}</option>)}
                </select>
              </div>
            )}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px', marginBottom: '16px' }}>
            <div>
              <label className="label-custom">Hình thức gửi tin</label>
              <select className="input-field w-full" value={formData.usageMethod} onChange={e => setFormData({...formData, usageMethod: e.target.value})}>
                <option value="">-- Chọn hình thức --</option>
                {(lookups.hinhThucSD || []).map((h: string) => <option key={h} value={h}>{h}</option>)}
              </select>
            </div>
            {formData.loaiDichVu === 'ZBS' && (
              <div>
                <label className="label-custom">Hình thức ĐK Mẫu tin</label>
                <select className="input-field w-full" value={formData.templateRegistrationMethod} onChange={e => setFormData({...formData, templateRegistrationMethod: e.target.value})}>
                  <option value="Thủ công qua file">Thủ công qua file</option><option value="GapOne">GapOne</option>
                </select>
              </div>
            )}
            {formData.loaiDichVu !== 'SMS' && formData.loaiDichVu !== 'ZBS' && formData.loaiDichVu !== 'Viber' && formData.loaiDichVu !== 'Whatsapp' && formData.loaiDichVu !== 'RCS' && formData.loaiDichVu !== 'MMS' && (
              <><div style={{ gridColumn: 'span 1' }}><label className="label-custom">Đầu số</label><input className="input-field w-full" value={formData.dauSo} onChange={e => setFormData({...formData, dauSo: e.target.value})} /></div>
              <div style={{ gridColumn: 'span 1' }}><label className="label-custom">Cú pháp</label><input className="input-field w-full" value={formData.cuPhap} onChange={e => setFormData({...formData, cuPhap: e.target.value})} /></div>
              <div style={{ gridColumn: 'span 1' }}><label className="label-custom">Quốc gia</label><input className="input-field w-full" value={formData.quocGia} onChange={e => setFormData({...formData, quocGia: e.target.value})} /></div></>
            )}
          </div>
        </div>

        <div style={{ background: 'var(--neutral-50)', padding: '20px', borderRadius: '8px', border: '1px solid var(--neutral-200)' }}>
          <h3 style={{ fontSize: '15px', fontWeight: 600, color: 'var(--neutral-800)', marginBottom: '16px', borderBottom: '1px solid var(--neutral-200)', paddingBottom: '8px' }}>3. Cấu hình kỹ thuật</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '16px', marginBottom: '16px' }}>
            {(formData.loaiDichVu === 'SMS' || formData.loaiDichVu === 'Khác' || !formData.loaiDichVu) && (
              <>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}><input type="checkbox" style={{ width: '16px', height: '16px' }} checked={formData.ketNoiAPIGateway === 'Có'} onChange={e => setFormData({...formData, ketNoiAPIGateway: e.target.checked ? 'Có' : ''})} /><span className="label-custom" style={{ margin: 0, cursor: 'pointer' }}>API Gateway</span></label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}><input type="checkbox" style={{ width: '16px', height: '16px' }} checked={formData.ketNoiSMPP === 'Có'} onChange={e => setFormData({...formData, ketNoiSMPP: e.target.checked ? 'Có' : ''})} /><span className="label-custom" style={{ margin: 0, cursor: 'pointer' }}>Kết nối SMPP</span></label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}><input type="checkbox" style={{ width: '16px', height: '16px' }} checked={formData.ketNoiAPIGapOne === 'Có'} onChange={e => setFormData({...formData, ketNoiAPIGapOne: e.target.checked ? 'Có' : ''})} /><span className="label-custom" style={{ margin: 0, cursor: 'pointer' }}>API GapOne</span></label>
              </>
            )}
            {formData.loaiDichVu !== 'SMS' && (
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}><input type="checkbox" style={{ width: '16px', height: '16px' }} checked={formData.ketNoiViZCA === 'Có'} onChange={e => setFormData({...formData, ketNoiViZCA: e.target.checked ? 'Có' : ''})} /><span className="label-custom" style={{ margin: 0, cursor: 'pointer' }}>Ví ZCA</span></label>
            )}
          </div>
          <div>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', marginBottom: '8px' }}><input type="checkbox" style={{ width: '16px', height: '16px' }} checked={!!formData.ketNoiHeThongKH} onChange={e => setFormData({...formData, ketNoiHeThongKH: e.target.checked ? 'Có' : ''})} /><span className="label-custom" style={{ margin: 0, cursor: 'pointer' }}>Tích hợp Hệ thống Khách hàng</span></label>
            {!!formData.ketNoiHeThongKH && <input className="input-field w-full animate-fade-in" value={formData.ketNoiHeThongKH} onChange={e => setFormData({...formData, ketNoiHeThongKH: e.target.value})} placeholder="Nhập tên/thông tin hệ thống KH..." style={{ marginTop: '8px' }} />}
          </div>
        </div>

        <div style={{ background: 'var(--neutral-50)', padding: '20px', borderRadius: '8px', border: '1px solid var(--neutral-200)' }}>
          <h3 style={{ fontSize: '15px', fontWeight: 600, color: 'var(--neutral-800)', marginBottom: '16px', borderBottom: '1px solid var(--neutral-200)', paddingBottom: '8px' }}>4. Ghi chú</h3>
          <div style={{ marginBottom: '16px' }}>
            <label className="label-custom" style={{ marginBottom: '8px', display: 'block' }}>Ghi chú bổ sung</label>
            <textarea className="input-field w-full" rows={3} value={formData.ghiChu} onChange={e => setFormData({...formData, ghiChu: e.target.value})} placeholder="Nhập ghi chú..." style={{ resize: 'vertical' }} />
          </div>
          <div>
            <label className="label-custom">Người thực hiện (Email) <span className="text-error-600">*</span></label>
            <input required type="email" className="input-field w-full" value={formData.actorEmail} onChange={e => setFormData({...formData, actorEmail: e.target.value})} disabled style={{ background: 'var(--neutral-100)', color: 'var(--neutral-600)', cursor: 'not-allowed' }} />
          </div>
        </div>
      </form>
    </Modal>

    <style dangerouslySetInnerHTML={{__html: `
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
        max-height: 250px;
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
      .dropdown-item:hover {
        background: var(--neutral-50);
        color: var(--primary-600);
      }
      .dropdown-item:last-child {
        border-bottom: none;
      }
    `}} />
    </>
  );
}
