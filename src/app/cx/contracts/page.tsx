"use client";

import React, { useEffect, useState, useRef } from 'react';
import { getContracts, getServicesByContractId, getContractsByCustomerId, createContract, updateContractInfo, getDropdownConfigs, getCustomers, createService, updateServiceInfo, getBrands, getCps } from '@/lib/cx-actions';
import { Search as SearchIcon, Filter, CheckSquare, Square, ChevronDown, Plus, Pencil, RefreshCw, X } from 'lucide-react';
import Pagination from '@/components/ui/Pagination';
import StatusBadge from '@/components/ui/StatusBadge';
import Modal from '@/components/ui/Modal';
import SkeletonLoader from '@/components/ui/SkeletonLoader';
import { useAuth } from '@/lib/AuthContext';

export default function ContractsPage() {
  const [contracts, setContracts] = useState<any[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const [customers, setCustomers] = useState<any[]>([]);
  const [lookups, setLookups] = useState<any>({});
  const [brandsList, setBrandsList] = useState<any[]>([]);
  const [cpsList, setCpsList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  const [expandedData, setExpandedData] = useState<{ services: any[], relatedContracts: any[] }>({ services: [], relatedContracts: [] });
  const [loadingExpanded, setLoadingExpanded] = useState(false);
  const { userEmail } = useAuth();

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string[]>([]);
  const [filterCS, setFilterCS] = useState<string[]>([]);
  const [filterSale, setFilterSale] = useState<string[]>([]);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);

  // Modals
  const [activeModal, setActiveModal] = useState<'add' | 'edit' | 'renew' | null>(null);
  const [activeServiceModal, setActiveServiceModal] = useState<'add' | 'edit' | 'renew' | null>(null);
  const [isWizardStep2, setIsWizardStep2] = useState(false);
  const [selectedContract, setSelectedContract] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    customerId: '', soHopDong: '', soPO: '', ngayBatDauHD: '', ngayKetThucHD: '', ngayBatDauPO: '', ngayKetThucPO: '', hinhThucThanhToan: '', previousContractId: '', actorEmail: '', trangThai: 'Active', tuDongGiaHan: false, chuKyGiaHan: ''
  });

  // Service Modals
  const [selectedService, setSelectedService] = useState<any>(null);
  const [isSubmittingService, setIsSubmittingService] = useState(false);
  const [serviceFormData, setServiceFormData] = useState({
    customerId: '', contractId: '', loaiDichVu: '', trangThai: 'Active', cpNameCode: '', brandNameOA: '', thoiHanBrand: '', dauSo: '', cuPhap: '', quocGia: '', ketNoiAPIGateway: '', ketNoiSMPP: '', ketNoiAPIGapOne: '', ketNoiViZCA: '', ketNoiHeThongKH: '', tenService: '', supPhuTrach: '', ngayBatDau: '', ngayHetHan: '', ghiChu: '', actorEmail: '', channel: '', usageMethod: '', packageType: '', packageStartDate: '', packageEndDate: '', termType: 'contract_bound', templateRegistrationMethod: 'Thủ công qua file'
  });

  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchData(1, searchQuery);
  }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setOpenDropdown(null);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  async function fetchData(page = 1, query = '') {
    setLoading(true);
    const [res, configsRes, custRes, brandsRes, cpsRes] = await Promise.all([
      getContracts(page, 20, query),
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
      setContracts(res.data);
      setTotalPages(res.totalPages || 1);
      setTotalRecords(res.totalRecords || 0);
      setCurrentPage(res.currentPage || 1);
      
      const params = new URLSearchParams(window.location.search);
      const editId = params.get('edit');
      if (editId) {
        const contractToEdit = res.data.find((c: any) => c.contract_id === editId);
        if (contractToEdit) {
          setSelectedContract(contractToEdit);
          setFormData({
            customerId: contractToEdit.customer_id || '', soHopDong: contractToEdit.so_hop_dong || '', soPO: contractToEdit.so_po || '', ngayBatDauHD: contractToEdit.ngay_bat_dau_hd || '', ngayKetThucHD: contractToEdit.ngay_ket_thuc_hd || '', ngayBatDauPO: contractToEdit.ngay_bat_dau_po || '', ngayKetThucPO: contractToEdit.ngay_ket_thuc_po || '', hinhThucThanhToan: contractToEdit.hinh_thuc_thanh_toan || '', previousContractId: contractToEdit.previous_contract_id || '', actorEmail: contractToEdit.created_by || '', trangThai: contractToEdit.trang_thai || 'Active', tuDongGiaHan: !!contractToEdit.tu_dong_gia_han, chuKyGiaHan: contractToEdit.chu_ky_gia_han || ''
          });
          setActiveModal('edit');
          window.history.replaceState({}, document.title, window.location.pathname);
        }
      }
    }
    setLoading(false);
  }

  const toggleFilter = (list: string[], setList: (v: string[]) => void, item: string) => {
    if (list.includes(item)) setList(list.filter(i => i !== item));
    else setList([...list, item]);
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '-';
    const parts = dateStr.split('-');
    if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`;
    return dateStr;
  };

  const uniqueStatus = ['Active', 'Expired', 'Expiring', 'Cancelled'];
  const availableCS = lookups.customerSuccess || [];
  const availableSale = lookups.tenSale || [];

  const filteredContracts = contracts.filter(c => {
    const term = searchQuery.toLowerCase();
    const matchSearch = 
      (c.contract_id || '').toLowerCase().includes(term) ||
      (c.customer_id || '').toLowerCase().includes(term) ||
      (c.so_hop_dong || '').toLowerCase().includes(term) ||
      (c.so_po || '').toLowerCase().includes(term);
      
    const matchStatus = filterStatus.length === 0 || filterStatus.includes(c.trang_thai);
    const matchCS = filterCS.length === 0 || filterCS.includes(c.cs_in_charge);
    const matchSale = filterSale.length === 0 || filterSale.includes(c.sale_in_charge);

    return matchSearch && matchStatus && matchCS && matchSale;
  });

  const openAddModal = () => {
    setFormData({
      customerId: '', soHopDong: '', soPO: '', ngayBatDauHD: '', ngayKetThucHD: '', ngayBatDauPO: '', ngayKetThucPO: '', hinhThucThanhToan: '', previousContractId: '', actorEmail: userEmail || '', trangThai: 'Active', tuDongGiaHan: false, chuKyGiaHan: ''
    });
    setActiveModal('add');
  };

  const openEditModal = (c: any) => {
    setSelectedContract(c);
    setFormData({
      customerId: c.customer_id || '', soHopDong: c.so_hop_dong || '', soPO: c.so_po || '', ngayBatDauHD: c.ngay_bat_dau_hd || '', ngayKetThucHD: c.ngay_ket_thuc_hd || '', ngayBatDauPO: c.ngay_bat_dau_po || '', ngayKetThucPO: c.ngay_ket_thuc_po || '', hinhThucThanhToan: c.hinh_thuc_thanh_toan || '', previousContractId: c.previous_contract_id || '', actorEmail: c.created_by || '', trangThai: c.trang_thai || 'Active', tuDongGiaHan: !!c.tu_dong_gia_han, chuKyGiaHan: c.chu_ky_gia_han || ''
    });
    setActiveModal('edit');
  };

  const openRenewModal = (c: any) => {
    setSelectedContract(c);
    setFormData({
      customerId: c.customer_id || '', soHopDong: '', soPO: '', ngayBatDauHD: c.ngay_ket_thuc_hd || '', ngayKetThucHD: '', ngayBatDauPO: '', ngayKetThucPO: '', hinhThucThanhToan: c.hinh_thuc_thanh_toan || '', previousContractId: c.contract_id || '', actorEmail: userEmail || '', trangThai: 'Active', tuDongGiaHan: !!c.tu_dong_gia_han, chuKyGiaHan: c.chu_ky_gia_han || ''
    });
    setActiveModal('renew');
  };

  const openAddServiceModal = (c: any) => {
    setServiceFormData({
      customerId: c.customer_id || '', contractId: c.contract_id || '', loaiDichVu: '', trangThai: 'Active', cpNameCode: '', brandNameOA: '', thoiHanBrand: '', dauSo: '', cuPhap: '', quocGia: '', ketNoiAPIGateway: '', ketNoiSMPP: '', ketNoiAPIGapOne: '', ketNoiViZCA: '', ketNoiHeThongKH: '', tenService: '', supPhuTrach: '', ngayBatDau: '', ngayHetHan: '', ghiChu: '', actorEmail: userEmail || '', channel: '', usageMethod: '', packageType: '', packageStartDate: '', packageEndDate: '', termType: 'contract_bound', templateRegistrationMethod: 'Thủ công qua file'
    });
    setActiveServiceModal('add');
  };

  const openEditServiceModal = (s: any) => {
    setSelectedService(s);
    setServiceFormData({
      customerId: s.customer_id || '', contractId: s.contract_id || '', loaiDichVu: s.loai_dich_vu || '', trangThai: s.trang_thai || 'Active', cpNameCode: s.cp_name_code || '', brandNameOA: s.brand_name_oa || '', thoiHanBrand: s.thoi_han_brand || '', dauSo: s.dau_so || '', cuPhap: s.cu_phap || '', quocGia: s.quoc_gia || '', ketNoiAPIGateway: s.ket_noi_api_gateway || '', ketNoiSMPP: s.ket_noi_smpp || '', ketNoiAPIGapOne: s.ket_noi_api_gap_one || '', ketNoiViZCA: s.ket_noi_vi_zca || '', ketNoiHeThongKH: s.ket_noi_he_thong_kh || '', tenService: s.ten_service || '', supPhuTrach: s.customer_support || '', ngayBatDau: s.ngay_bat_dau || '', ngayHetHan: s.ngay_het_han || '', ghiChu: s.ghi_chu || '', actorEmail: s.created_by || '', channel: s.channel || '', usageMethod: s.usage_method || '', packageType: s.package_type || '', packageStartDate: s.package_start_date || '', packageEndDate: s.package_end_date || '', termType: s.term_type || 'contract_bound', templateRegistrationMethod: s.template_registration_method || 'Thủ công qua file'
    });
    setActiveServiceModal('edit');
  };

  const openRenewServiceModal = (s: any) => {
    setSelectedService(s);
    setServiceFormData({
      customerId: s.customer_id || '', contractId: s.contract_id || '', loaiDichVu: s.loai_dich_vu || '', trangThai: 'Active', cpNameCode: s.cp_name_code || '', brandNameOA: s.brand_name_oa || '', thoiHanBrand: '', dauSo: s.dau_so || '', cuPhap: s.cu_phap || '', quocGia: s.quoc_gia || '', ketNoiAPIGateway: s.ket_noi_api_gateway || '', ketNoiSMPP: s.ket_noi_smpp || '', ketNoiAPIGapOne: s.ket_noi_api_gap_one || '', ketNoiViZCA: s.ket_noi_vi_zca || '', ketNoiHeThongKH: s.ket_noi_he_thong_kh || '', tenService: s.ten_service || '', supPhuTrach: s.customer_support || '', ngayBatDau: s.ngay_het_han || '', ngayHetHan: '', ghiChu: s.ghi_chu || '', actorEmail: userEmail || '', channel: s.channel || '', usageMethod: s.usage_method || '', packageType: s.package_type || '', packageStartDate: s.package_start_date || '', packageEndDate: s.package_end_date || '', termType: s.term_type || 'contract_bound', templateRegistrationMethod: s.template_registration_method || 'Thủ công qua file'
    });
    setActiveServiceModal('renew');
  };

  const handleExpand = async (c: any) => {
    if (expandedRow === c.contract_id) {
      setExpandedRow(null);
      return;
    }
    setExpandedRow(c.contract_id);
    setLoadingExpanded(true);
    
    const [servRes, contRes] = await Promise.all([
      getServicesByContractId(c.contract_id),
      getContractsByCustomerId(c.customer_id)
    ]);
    
    setExpandedData({
      services: servRes.success && servRes.data ? servRes.data : [],
      relatedContracts: contRes.success && contRes.data ? contRes.data.filter((x: any) => x.contract_id !== c.contract_id) : []
    });
    setLoadingExpanded(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      if (activeModal === 'add') {
        const res = await createContract(formData);
        if (!res.success) throw new Error(res.error);
        
        setActiveModal(null);
        setServiceFormData(prev => ({ ...prev, customerId: formData.customerId, contractId: res.contractId || '' }));
        setActiveServiceModal('add');
        setIsWizardStep2(true);
        setIsSubmitting(false);
        return;
      } else if (activeModal === 'edit') {
        const payload = { ...formData, contractId: selectedContract.contract_id };
        const res = await updateContractInfo(payload);
        if (!res.success) throw new Error(res.error);
      } else if (activeModal === 'renew') {
        const { renewContract } = await import('@/lib/cx-actions');
        const payload = {
          type: 'contract', customerId: formData.customerId, contractIdCu: formData.previousContractId, soHopDong: formData.soHopDong, soPO: formData.soPO, ngayBatDauMoi: formData.ngayBatDauHD, ngayKetThucMoi: formData.ngayKetThucHD, ngayBatDauPO: formData.ngayBatDauPO, ngayKetThucPO: formData.ngayKetThucPO, hinhThucThanhToan: formData.hinhThucThanhToan, trangThai: formData.trangThai, tuDongGiaHan: formData.tuDongGiaHan, chuKyGiaHan: formData.tuDongGiaHan ? parseInt(formData.chuKyGiaHan) || null : null, actorEmail: userEmail
        };
        const res = await renewContract(payload);
        if (!res.success) throw new Error(res.error);
      }
      await fetchData();
      setActiveModal(null);
    } catch (err: any) {
      alert("Lỗi: " + err.message);
    }
    setIsSubmitting(false);
  };

  const handleServiceSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmittingService(true);
    try {
      if (activeServiceModal === 'add') {
        const res = await createService(serviceFormData);
        if (!res.success) throw new Error(res.error);
      } else if (activeServiceModal === 'edit') {
        const payload = { ...serviceFormData, serviceId: selectedService.service_id };
        const res = await updateServiceInfo(payload);
        if (!res.success) throw new Error(res.error);
      } else if (activeServiceModal === 'renew') {
        const { renewContract } = await import('@/lib/cx-actions');
        const payload = {
          type: 'service', targetId: selectedService.service_id, customerId: serviceFormData.customerId, ngayBatDauMoi: serviceFormData.ngayBatDau, ngayKetThucMoi: serviceFormData.ngayHetHan, actorEmail: userEmail, ghiChu: serviceFormData.ghiChu
        };
        const res = await renewContract(payload);
        if (!res.success) throw new Error(res.error);
      }
      
      if (expandedRow) {
        setLoadingExpanded(true);
        const [servRes, contRes] = await Promise.all([
          getServicesByContractId(expandedRow), getContractsByCustomerId(serviceFormData.customerId)
        ]);
        setExpandedData({
          services: servRes.success && servRes.data ? servRes.data : [],
          relatedContracts: contRes.success && contRes.data ? contRes.data.filter((x: any) => x.contract_id !== expandedRow) : []
        });
        setLoadingExpanded(false);
      }
      if (isWizardStep2) {
        setIsWizardStep2(false);
        alert('Tạo Hợp đồng và Dịch vụ thành công!');
        await fetchData();
      }
      
      setActiveServiceModal(null);
    } catch (err: any) {
      alert("Lỗi: " + err.message);
    }
    setIsSubmittingService(false);
  };

  return (
    <>
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div className="page-header">
        <div>
          <h1 style={{ fontSize: 'var(--text-2xl)', fontWeight: 800, color: 'var(--neutral-900)', margin: '0 0 4px 0', display: 'flex', alignItems: 'center', gap: '12px' }}>
            Quản lý Hợp đồng <span className="badge-custom" style={{ background: 'var(--primary-100)', color: 'var(--primary-800)', fontSize: '14px', verticalAlign: 'middle' }}>{totalRecords} Hợp đồng</span>
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
              placeholder="Mã KH, Số HĐ, Số PO..."
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
          <label className="label-custom" style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '8px' }}>Customer Success</label>
          <div className="input-field w-full" style={{ height: '42px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', background: '#FFFFFF' }} onClick={() => setOpenDropdown(openDropdown === 'cs' ? null : 'cs')}>
            <span style={{ fontSize: '14px', color: filterCS.length ? 'var(--neutral-900)' : 'var(--neutral-500)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {filterCS.length === 0 ? 'Tất cả CS' : filterCS.join(', ')}
            </span>
            <ChevronDown size={16} style={{ color: 'var(--neutral-500)' }} />
          </div>
          {openDropdown === 'cs' && (
            <div className="custom-dropdown">
              {availableCS.map((s: string) => (
                <div key={s} className="dropdown-item" onClick={() => toggleFilter(filterCS, setFilterCS, s)} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {filterCS.includes(s) ? <CheckSquare size={16} style={{ color: 'var(--primary-600)' }} /> : <Square size={16} style={{ color: 'var(--neutral-400)' }} />}
                  {s}
                </div>
              ))}
            </div>
          )}
        </div>

        <div style={{ position: 'relative', flex: '1 1 180px' }}>
          <label className="label-custom" style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '8px' }}>Tên Sale</label>
          <div className="input-field w-full" style={{ height: '42px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', background: '#FFFFFF' }} onClick={() => setOpenDropdown(openDropdown === 'sale' ? null : 'sale')}>
            <span style={{ fontSize: '14px', color: filterSale.length ? 'var(--neutral-900)' : 'var(--neutral-500)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {filterSale.length === 0 ? 'Tất cả Sale' : filterSale.join(', ')}
            </span>
            <ChevronDown size={16} style={{ color: 'var(--neutral-500)' }} />
          </div>
          {openDropdown === 'sale' && (
            <div className="custom-dropdown">
              {availableSale.map((s: string) => (
                <div key={s} className="dropdown-item" onClick={() => toggleFilter(filterSale, setFilterSale, s)} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {filterSale.includes(s) ? <CheckSquare size={16} style={{ color: 'var(--primary-600)' }} /> : <Square size={16} style={{ color: 'var(--neutral-400)' }} />}
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
        ) : filteredContracts.length === 0 ? (
          <div style={{ padding: '60px 40px', textAlign: 'center', color: 'var(--neutral-500)' }}>Không có dữ liệu hợp đồng nào khớp với bộ lọc.</div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="custom-table" style={{ margin: 0, minWidth: '1000px' }}>
              <thead>
                <tr>
                  <th>Công ty</th>
                  <th>Org ID</th>
                  <th>Số HĐ</th>
                  <th>Bắt đầu</th>
                  <th>Kết thúc</th>
                  <th>Trạng thái</th>
                  <th>CS</th>
                  <th>Sale</th>
                  <th style={{ textAlign: 'center' }}>Dịch vụ</th>
                  <th style={{ textAlign: 'center' }}>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {filteredContracts.map(c => {
                  const isExpanded = expandedRow === c.contract_id;
                  return (
                    <React.Fragment key={c.contract_id}>
                      <tr onClick={() => handleExpand(c)} className="row-hover" style={{ cursor: 'pointer', background: isExpanded ? 'var(--primary-50)' : 'transparent' }}>
                        <td style={{ color: 'var(--neutral-900)', fontWeight: 600 }}>{c.ten_cong_ty || '--'}</td>
                        <td style={{ color: 'var(--neutral-600)' }}>{c.org_id || '--'}</td>
                        <td style={{ color: 'var(--neutral-900)', fontWeight: 500 }}>{c.so_hop_dong || '--'}</td>
                        <td>{formatDate(c.ngay_bat_dau_hd)}</td>
                        <td>{formatDate(c.ngay_ket_thuc_hd)}</td>
                        <td><StatusBadge status={c.trang_thai} /></td>
                        <td>{c.cs_in_charge || '--'}</td>
                        <td>{c.sale_in_charge || '--'}</td>
                        <td style={{ textAlign: 'center' }}>
                          <span style={{ fontWeight: 600, color: 'var(--primary-600)', background: 'var(--primary-100)', padding: '4px 8px', borderRadius: '4px' }}>
                            {c.total_services || 0}
                          </span>
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                            <button className="btn btn-secondary hover-bg-gray" style={{ padding: '4px 8px', fontSize: '12px' }} onClick={(e) => { e.stopPropagation(); openEditModal(c); }} title="Chỉnh sửa">
                              <Pencil size={14} />
                            </button>
                            <button className="btn btn-secondary hover-bg-gray" style={{ padding: '4px 8px', fontSize: '12px' }} onClick={(e) => { e.stopPropagation(); openRenewModal(c); }} title="Gia hạn hợp đồng">
                              <RefreshCw size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                      {isExpanded && (
                        <tr>
                          <td colSpan={10} style={{ background: 'var(--neutral-25)', padding: '0', borderBottom: '1px solid var(--neutral-200)' }}>
                            <div className="animate-fade-in-down" style={{ padding: '24px 32px', borderTop: '1px dashed var(--primary-200)' }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                                <h4 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--primary-700)', margin: 0 }}>Dịch vụ thuộc Hợp đồng</h4>
                                <button className="btn btn-secondary hover-bg-gray" style={{ padding: '6px 12px', fontSize: '13px' }} onClick={() => openAddServiceModal(c)}>
                                  <Plus size={14} style={{ marginRight: '4px' }}/> Thêm dịch vụ
                                </button>
                              </div>
                              
                              {loadingExpanded ? (
                                <div style={{ fontSize: '13px', color: 'var(--neutral-500)' }}>Đang tải...</div>
                              ) : expandedData.services.length === 0 ? (
                                <div style={{ fontSize: '13px', color: 'var(--neutral-500)', fontStyle: 'italic', padding: '16px', background: '#fff', borderRadius: '8px', border: '1px dashed var(--neutral-300)', textAlign: 'center' }}>
                                  Chưa có dịch vụ nào liên kết.
                                </div>
                              ) : (
                                <div style={{ overflowX: 'auto', background: '#fff', borderRadius: '8px', border: '1px solid var(--neutral-200)' }}>
                                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                                    <thead>
                                      <tr style={{ background: 'var(--neutral-50)', borderBottom: '1px solid var(--neutral-200)' }}>
                                        <th style={{ padding: '10px 16px', fontWeight: 600, color: 'var(--neutral-600)', textAlign: 'left' }}>Mã DV</th>
                                        <th style={{ padding: '10px 16px', fontWeight: 600, color: 'var(--neutral-600)', textAlign: 'left' }}>Loại DV</th>
                                        <th style={{ padding: '10px 16px', fontWeight: 600, color: 'var(--neutral-600)', textAlign: 'left' }}>Brand/OA</th>
                                        <th style={{ padding: '10px 16px', fontWeight: 600, color: 'var(--neutral-600)', textAlign: 'left' }}>CPID</th>
                                        <th style={{ padding: '10px 16px', fontWeight: 600, color: 'var(--neutral-600)', textAlign: 'left' }}>Bắt đầu</th>
                                        <th style={{ padding: '10px 16px', fontWeight: 600, color: 'var(--neutral-600)', textAlign: 'left' }}>Hết hạn</th>
                                        <th style={{ padding: '10px 16px', fontWeight: 600, color: 'var(--neutral-600)', textAlign: 'left' }}>SUP</th>
                                        <th style={{ padding: '10px 16px', fontWeight: 600, color: 'var(--neutral-600)', textAlign: 'left' }}>Trạng thái</th>
                                        <th style={{ padding: '10px 16px', fontWeight: 600, color: 'var(--neutral-600)', textAlign: 'center' }}>Thao tác</th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {expandedData.services.map((s, idx) => (
                                        <tr key={idx} style={{ borderBottom: '1px solid var(--neutral-100)' }}>
                                          <td style={{ padding: '10px 16px', fontWeight: 600, color: 'var(--primary-700)' }}>{s.service_id}</td>
                                          <td style={{ padding: '10px 16px' }}>{s.loai_dich_vu || '--'}</td>
                                          <td style={{ padding: '10px 16px' }}>{s.brand_name_oa || '--'}</td>
                                          <td style={{ padding: '10px 16px' }}>{s.cp_name_code || '--'}</td>
                                          <td style={{ padding: '10px 16px' }}>{formatDate(s.ngay_bat_dau)}</td>
                                          <td style={{ padding: '10px 16px' }}>{formatDate(s.ngay_het_han)}</td>
                                          <td style={{ padding: '10px 16px' }}>{s.customer_support || '--'}</td>
                                          <td style={{ padding: '10px 16px' }}><StatusBadge status={s.trang_thai} /></td>
                                          <td style={{ padding: '10px 16px', textAlign: 'center' }}>
                                            <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                                              <button className="btn btn-secondary hover-bg-gray" style={{ padding: '4px 8px', fontSize: '12px' }} onClick={() => openEditServiceModal(s)} title="Chỉnh sửa">
                                                <Pencil size={14} />
                                              </button>
                                              <button className="btn btn-secondary hover-bg-gray" style={{ padding: '4px 8px', fontSize: '12px' }} onClick={() => openRenewServiceModal(s)} title="Gia hạn dịch vụ">
                                                <RefreshCw size={14} />
                                              </button>
                                            </div>
                                          </td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                </div>
                              )}
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
        
        <Pagination 
          currentPage={currentPage} 
          totalPages={totalPages} 
          totalItems={totalRecords} 
          onPageChange={(page) => fetchData(page, searchQuery)} 
        />
      </div>
    </div>

    {/* Contract Modal */}
    <Modal
      isOpen={['add', 'edit', 'renew'].includes(activeModal as string)}
      onClose={() => setActiveModal(null)}
      title={activeModal === 'add' ? 'Thêm mới Hợp đồng' : activeModal === 'renew' ? 'Gia hạn Hợp đồng' : 'Chỉnh sửa Hợp đồng'}
      width="700px"
      footer={
        <div style={{ display: 'flex', gap: '12px', width: '100%' }}>
          <button type="button" onClick={() => setActiveModal(null)} className="btn btn-secondary hover-bg-gray" style={{ flex: 1, padding: '10px' }}>
            Hủy
          </button>
          <button type="submit" form="contractForm" disabled={isSubmitting} className="btn btn-primary" style={{ flex: 1, padding: '10px' }}>
            {isSubmitting ? 'Đang lưu...' : activeModal === 'renew' ? 'Lưu Gia hạn' : 'Lưu Hợp đồng'}
          </button>
        </div>
      }
    >
      <form id="contractForm" onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <div>
            <label className="label-custom">Mã Khách Hàng <span className="text-error-600">*</span></label>
            <select required className="input-field w-full" value={formData.customerId} onChange={e => setFormData({...formData, customerId: e.target.value})} disabled={activeModal === 'renew'}>
              <option value="">-- Chọn Khách hàng --</option>
              {customers.map(c => <option key={c.customer_id} value={c.customer_id}>{c.customer_id} - {c.ten_cong_ty}</option>)}
            </select>
          </div>
          <div>
            <label className="label-custom">Trạng thái</label>
            <select className="input-field w-full" value={formData.trangThai} onChange={e => setFormData({...formData, trangThai: e.target.value})}>
              <option value="Active">Active</option>
              <option value="Expired">Expired</option>
              <option value="Expiring">Expiring</option>
              <option value="Cancelled">Cancelled</option>
            </select>
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <div><label className="label-custom">Số Hợp đồng</label><input className="input-field w-full" value={formData.soHopDong} onChange={e => setFormData({...formData, soHopDong: e.target.value})} /></div>
          <div><label className="label-custom">Số PO</label><input className="input-field w-full" value={formData.soPO} onChange={e => setFormData({...formData, soPO: e.target.value})} /></div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <div><label className="label-custom">Ngày bắt đầu HĐ</label><input type="date" className="input-field w-full" value={formData.ngayBatDauHD} onChange={e => setFormData({...formData, ngayBatDauHD: e.target.value})} /></div>
          <div><label className="label-custom">Ngày kết thúc HĐ</label><input type="date" className="input-field w-full" value={formData.ngayKetThucHD} onChange={e => setFormData({...formData, ngayKetThucHD: e.target.value})} /></div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <div><label className="label-custom">Ngày bắt đầu PO</label><input type="date" className="input-field w-full" value={formData.ngayBatDauPO} onChange={e => setFormData({...formData, ngayBatDauPO: e.target.value})} /></div>
          <div><label className="label-custom">Ngày kết thúc PO</label><input type="date" className="input-field w-full" value={formData.ngayKetThucPO} onChange={e => setFormData({...formData, ngayKetThucPO: e.target.value})} /></div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <div><label className="label-custom">Hình thức thanh toán</label><input className="input-field w-full" value={formData.hinhThucThanhToan} onChange={e => setFormData({...formData, hinhThucThanhToan: e.target.value})} placeholder="VD: Tiền mặt, Chuyển khoản, Thẻ..." /></div>
          <div><label className="label-custom">Hợp đồng trước đó (Nếu có)</label><input className="input-field w-full" value={formData.previousContractId} onChange={e => setFormData({...formData, previousContractId: e.target.value})} placeholder="Nhập ID hợp đồng trước" /></div>
        </div>
        <div style={{ background: 'var(--neutral-50)', padding: '16px', borderRadius: '8px', border: '1px solid var(--neutral-200)', marginTop: '8px' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontWeight: 600, color: 'var(--neutral-900)' }}>
            <input type="checkbox" checked={formData.tuDongGiaHan} onChange={e => setFormData({...formData, tuDongGiaHan: e.target.checked})} style={{ width: '18px', height: '18px', cursor: 'pointer' }} /> Tự động gia hạn hợp đồng
          </label>
          {formData.tuDongGiaHan && (
            <div style={{ marginTop: '16px', display: 'flex', gap: '12px', alignItems: 'center' }}>
              <div style={{ flex: 1 }}>
                <label className="label-custom">Chu kỳ gia hạn (tháng) <span className="text-error-600">*</span></label>
                <select required className="input-field w-full" value={formData.chuKyGiaHan} onChange={e => setFormData({...formData, chuKyGiaHan: e.target.value})}>
                  <option value="">Chọn chu kỳ</option><option value="1">1 tháng</option><option value="3">3 tháng</option><option value="6">6 tháng</option><option value="12">12 tháng (1 năm)</option><option value="24">24 tháng (2 năm)</option>
                </select>
              </div>
              <div style={{ flex: 1, fontSize: '12px', color: 'var(--neutral-500)', paddingTop: '24px' }}>* Hệ thống sẽ tự tạo HĐ mới và gia hạn dịch vụ tương ứng khi HĐ này sắp hết hạn.</div>
            </div>
          )}
        </div>
        <div>
          <label className="label-custom">Người thực hiện (Email) <span className="text-error-600">*</span></label>
          <input required type="email" className="input-field w-full" value={formData.actorEmail} onChange={e => setFormData({...formData, actorEmail: e.target.value})} disabled style={{ background: 'var(--neutral-100)', color: 'var(--neutral-600)', cursor: 'not-allowed' }} />
        </div>
        {activeModal === 'renew' && (
          <div style={{ marginTop: '8px', padding: '12px', background: 'var(--warning-50)', borderLeft: '4px solid var(--warning-500)', color: 'var(--warning-700)', borderRadius: '0 4px 4px 0', fontSize: '13px' }}>
            <strong style={{ display: 'block', marginBottom: '4px' }}>⚠️ Lưu ý khi gia hạn:</strong> Khi gia hạn thành công, toàn bộ Dịch vụ của hợp đồng cũ sẽ tự động được nhân bản sang Hợp đồng mới và cập nhật thời hạn.
          </div>
        )}
      </form>
    </Modal>

    {/* Service Modal */}
    <Modal
      isOpen={['add', 'edit', 'renew'].includes(activeServiceModal as string)}
      onClose={() => !isWizardStep2 && setActiveServiceModal(null)}
      title={isWizardStep2 ? 'Bước 2: Tạo Dịch vụ đi kèm (Bắt buộc)' : activeServiceModal === 'add' ? 'Thêm mới Dịch vụ' : activeServiceModal === 'edit' ? 'Chỉnh sửa Dịch vụ' : 'Gia hạn Dịch vụ'}
      width="800px"
      footer={
        <div style={{ display: 'flex', gap: '12px', width: '100%' }}>
          {!isWizardStep2 && (
            <button type="button" onClick={() => setActiveServiceModal(null)} className="btn btn-secondary hover-bg-gray" style={{ flex: 1, padding: '10px' }}>Hủy</button>
          )}
          <button type="submit" form="serviceForm" disabled={isSubmittingService} className="btn btn-primary" style={{ flex: 1, padding: '10px' }}>
            {isSubmittingService ? 'Đang lưu...' : activeServiceModal === 'renew' ? 'Lưu Gia hạn' : 'Lưu Dịch vụ'}
          </button>
        </div>
      }
    >
      <form id="serviceForm" onSubmit={handleServiceSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div style={{ background: 'var(--neutral-50)', padding: '20px', borderRadius: '8px', border: '1px solid var(--neutral-200)' }}>
          <h3 style={{ fontSize: '15px', fontWeight: 600, color: 'var(--neutral-800)', marginBottom: '16px', borderBottom: '1px solid var(--neutral-200)', paddingBottom: '8px' }}>1. Thông tin chung</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
            <div>
              <label className="label-custom">Khách hàng <span className="text-error-600">*</span></label>
              <select required className="input-field w-full" value={serviceFormData.customerId} onChange={e => setServiceFormData({...serviceFormData, customerId: e.target.value})} disabled={activeServiceModal === 'renew' || isWizardStep2}>
                <option value="">-- Chọn Khách hàng --</option>
                {customers.map(c => <option key={c.customer_id} value={c.customer_id}>{c.customer_id} - {c.ten_cong_ty}</option>)}
              </select>
            </div>
            <div>
              <label className="label-custom">HĐ/PO liên kết</label>
              <input className="input-field w-full" value={serviceFormData.contractId} disabled style={{ background: 'var(--neutral-100)' }} />
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
            <div>
              <label className="label-custom">Loại Dịch vụ <span className="text-error-600">*</span></label>
              <select required className="input-field w-full" value={serviceFormData.loaiDichVu} onChange={e => setServiceFormData({...serviceFormData, loaiDichVu: e.target.value})}>
                <option value="">-- Chọn Loại DV --</option>
                {(lookups.loaiDichVu || []).map((t: string) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="label-custom">SUP Phụ trách</label>
              <select className="input-field w-full" value={serviceFormData.supPhuTrach} onChange={e => setServiceFormData({...serviceFormData, supPhuTrach: e.target.value})}>
                <option value="">-- Chọn SUP --</option>
                {(lookups.customerSupport || []).map((sup: string) => <option key={sup} value={sup}>{sup}</option>)}
              </select>
            </div>
            <div>
              <label className="label-custom">Trạng thái</label>
              <select className="input-field w-full" value={serviceFormData.trangThai} onChange={e => setServiceFormData({...serviceFormData, trangThai: e.target.value})}>
                <option value="Active">Active</option>
                <option value="Pending">Pending</option>
                <option value="Expired">Expired</option>
                <option value="Cancelled">Cancelled</option>
              </select>
            </div>
          </div>
        </div>

        <div style={{ background: 'var(--neutral-50)', padding: '20px', borderRadius: '8px', border: '1px solid var(--neutral-200)' }}>
          <h3 style={{ fontSize: '15px', fontWeight: 600, color: 'var(--neutral-800)', marginBottom: '16px', borderBottom: '1px solid var(--neutral-200)', paddingBottom: '8px' }}>2. Chi tiết nghiệp vụ</h3>
          <datalist id="cps-list">{cpsList.map(cp => <option key={cp.id} value={cp.name} />)}</datalist>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px', marginBottom: '16px' }}>
            {(serviceFormData.loaiDichVu === 'SMS' || serviceFormData.loaiDichVu === 'Khác' || !serviceFormData.loaiDichVu) && (
              <div><label className="label-custom">CP Name</label><input className="input-field w-full" list="cps-list" value={serviceFormData.cpNameCode} onChange={e => setServiceFormData({...serviceFormData, cpNameCode: e.target.value})} placeholder="Chọn hoặc nhập mới" /></div>
            )}
            <div><label className="label-custom">Brand/OA (Có thể nhập nhiều)</label><input className="input-field w-full" value={serviceFormData.brandNameOA} onChange={e => setServiceFormData({...serviceFormData, brandNameOA: e.target.value})} placeholder="Vd: BrandA, BrandB, OA1" /></div>
            {(serviceFormData.loaiDichVu === 'SMS' || serviceFormData.loaiDichVu === 'ZBS' || serviceFormData.loaiDichVu === 'Khác' || !serviceFormData.loaiDichVu) && (
              <div>
                <label className="label-custom">Kênh gửi tin</label>
                <select className="input-field w-full" value={serviceFormData.channel} onChange={e => setServiceFormData({...serviceFormData, channel: e.target.value})}>
                  <option value="">-- Chọn kênh --</option>
                  {serviceFormData.loaiDichVu === 'SMS' && <><option value="SMS CSKH">SMS CSKH</option><option value="SMS QC">SMS QC</option><option value="SMS Full">SMS Full</option></>}
                  {serviceFormData.loaiDichVu === 'ZBS' && <><option value="ZBS SĐT">ZBS SĐT</option><option value="ZBS UID">ZBS UID</option><option value="ZBS Full">ZBS Full</option></>}
                  {serviceFormData.loaiDichVu !== 'SMS' && serviceFormData.loaiDichVu !== 'ZBS' && (lookups.kenhGuiTin || []).map((k: string) => <option key={k} value={k}>{k}</option>)}
                </select>
              </div>
            )}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px', marginBottom: '16px' }}>
            <div>
              <label className="label-custom">Hình thức gửi tin</label>
              <select className="input-field w-full" value={serviceFormData.usageMethod} onChange={e => setServiceFormData({...serviceFormData, usageMethod: e.target.value})}>
                <option value="">-- Chọn hình thức --</option>
                {(lookups.hinhThucSD || []).map((h: string) => <option key={h} value={h}>{h}</option>)}
              </select>
            </div>
            {serviceFormData.loaiDichVu === 'ZBS' && (
              <div>
                <label className="label-custom">Hình thức ĐK Mẫu tin</label>
                <select className="input-field w-full" value={serviceFormData.templateRegistrationMethod} onChange={e => setServiceFormData({...serviceFormData, templateRegistrationMethod: e.target.value})}>
                  <option value="Thủ công qua file">Thủ công qua file</option><option value="GapOne">GapOne</option>
                </select>
              </div>
            )}
            {serviceFormData.loaiDichVu !== 'SMS' && serviceFormData.loaiDichVu !== 'ZBS' && serviceFormData.loaiDichVu !== 'Viber' && serviceFormData.loaiDichVu !== 'Whatsapp' && serviceFormData.loaiDichVu !== 'RCS' && serviceFormData.loaiDichVu !== 'MMS' && (
              <><div style={{ gridColumn: 'span 1' }}><label className="label-custom">Đầu số</label><input className="input-field w-full" value={serviceFormData.dauSo} onChange={e => setServiceFormData({...serviceFormData, dauSo: e.target.value})} /></div>
              <div style={{ gridColumn: 'span 1' }}><label className="label-custom">Cú pháp</label><input className="input-field w-full" value={serviceFormData.cuPhap} onChange={e => setServiceFormData({...serviceFormData, cuPhap: e.target.value})} /></div>
              <div style={{ gridColumn: 'span 1' }}><label className="label-custom">Quốc gia</label><input className="input-field w-full" value={serviceFormData.quocGia} onChange={e => setServiceFormData({...serviceFormData, quocGia: e.target.value})} /></div></>
            )}
          </div>
        </div>

        <div style={{ background: 'var(--neutral-50)', padding: '20px', borderRadius: '8px', border: '1px solid var(--neutral-200)' }}>
          <h3 style={{ fontSize: '15px', fontWeight: 600, color: 'var(--neutral-800)', marginBottom: '16px', borderBottom: '1px solid var(--neutral-200)', paddingBottom: '8px' }}>3. Cấu hình kỹ thuật</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '16px', marginBottom: '16px' }}>
            {(serviceFormData.loaiDichVu === 'SMS' || serviceFormData.loaiDichVu === 'Khác' || !serviceFormData.loaiDichVu) && (
              <>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}><input type="checkbox" style={{ width: '16px', height: '16px' }} checked={serviceFormData.ketNoiAPIGateway === 'Có'} onChange={e => setServiceFormData({...serviceFormData, ketNoiAPIGateway: e.target.checked ? 'Có' : ''})} /><span className="label-custom" style={{ margin: 0, cursor: 'pointer' }}>API Gateway</span></label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}><input type="checkbox" style={{ width: '16px', height: '16px' }} checked={serviceFormData.ketNoiSMPP === 'Có'} onChange={e => setServiceFormData({...serviceFormData, ketNoiSMPP: e.target.checked ? 'Có' : ''})} /><span className="label-custom" style={{ margin: 0, cursor: 'pointer' }}>Kết nối SMPP</span></label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}><input type="checkbox" style={{ width: '16px', height: '16px' }} checked={serviceFormData.ketNoiAPIGapOne === 'Có'} onChange={e => setServiceFormData({...serviceFormData, ketNoiAPIGapOne: e.target.checked ? 'Có' : ''})} /><span className="label-custom" style={{ margin: 0, cursor: 'pointer' }}>API GapOne</span></label>
              </>
            )}
            {serviceFormData.loaiDichVu !== 'SMS' && (
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}><input type="checkbox" style={{ width: '16px', height: '16px' }} checked={serviceFormData.ketNoiViZCA === 'Có'} onChange={e => setServiceFormData({...serviceFormData, ketNoiViZCA: e.target.checked ? 'Có' : ''})} /><span className="label-custom" style={{ margin: 0, cursor: 'pointer' }}>Ví ZCA</span></label>
            )}
          </div>
          <div>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', marginBottom: '8px' }}><input type="checkbox" style={{ width: '16px', height: '16px' }} checked={!!serviceFormData.ketNoiHeThongKH} onChange={e => setServiceFormData({...serviceFormData, ketNoiHeThongKH: e.target.checked ? 'Có' : ''})} /><span className="label-custom" style={{ margin: 0, cursor: 'pointer' }}>Tích hợp Hệ thống Khách hàng</span></label>
            {!!serviceFormData.ketNoiHeThongKH && <input className="input-field w-full animate-fade-in" value={serviceFormData.ketNoiHeThongKH} onChange={e => setServiceFormData({...serviceFormData, ketNoiHeThongKH: e.target.value})} placeholder="Nhập tên/thông tin hệ thống KH..." style={{ marginTop: '8px' }} />}
          </div>
        </div>

        <div style={{ background: 'var(--neutral-50)', padding: '20px', borderRadius: '8px', border: '1px solid var(--neutral-200)' }}>
          <h3 style={{ fontSize: '15px', fontWeight: 600, color: 'var(--neutral-800)', marginBottom: '16px', borderBottom: '1px solid var(--neutral-200)', paddingBottom: '8px' }}>4. Ghi chú</h3>
          <div style={{ marginBottom: '16px' }}>
            <label className="label-custom" style={{ marginBottom: '8px', display: 'block' }}>Ghi chú bổ sung</label>
            <textarea className="input-field w-full" rows={3} value={serviceFormData.ghiChu} onChange={e => setServiceFormData({...serviceFormData, ghiChu: e.target.value})} placeholder="Nhập ghi chú..." style={{ resize: 'vertical' }} />
          </div>
          <div>
            <label className="label-custom">Người thực hiện (Email) <span className="text-error-600">*</span></label>
            <input required type="email" className="input-field w-full" value={serviceFormData.actorEmail} onChange={e => setServiceFormData({...serviceFormData, actorEmail: e.target.value})} disabled style={{ background: 'var(--neutral-100)', color: 'var(--neutral-600)', cursor: 'not-allowed' }} />
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