"use client";

import React, { useEffect, useState, useRef } from 'react';
import { getContracts, getServicesByContractId, getContractsByCustomerId, createContract, updateContractInfo, getDropdownConfigs, getCustomers, createService, updateServiceInfo } from '@/lib/cx-actions';
import { Search as SearchIcon, Filter, CheckSquare, Square, ChevronDown, Plus, Edit2, Info, X } from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';

export default function ContractsPage() {
  const [contracts, setContracts] = useState<any[]>([]);
  const [lookups, setLookups] = useState<any>({});
  const [loading, setLoading] = useState(true);

  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  const [expandedData, setExpandedData] = useState<{ services: any[], relatedContracts: any[] }>({ services: [], relatedContracts: [] });
  const [loadingExpanded, setLoadingExpanded] = useState(false);
  const [customers, setCustomers] = useState<any[]>([]);
  const { userEmail } = useAuth();

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string[]>([]);
  const [filterCS, setFilterCS] = useState<string[]>([]);
  const [filterSUP, setFilterSUP] = useState<string[]>([]);
  const [filterSale, setFilterSale] = useState<string[]>([]);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);

  // Modals
  const [activeModal, setActiveModal] = useState<'add' | 'edit' | 'renew' | null>(null);
  const [selectedContract, setSelectedContract] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    customerId: '',
    soHopDong: '',
    soPO: '',
    ngayBatDauHD: '',
    ngayKetThucHD: '',
    ngayBatDauPO: '',
    ngayKetThucPO: '',
    hinhThucThanhToan: '',
    previousContractId: '',
    actorEmail: '',
    trangThai: 'Active',
    tuDongGiaHan: false,
    chuKyGiaHan: ''
  });

  // Service Modals
  const [activeServiceModal, setActiveServiceModal] = useState<'add' | 'edit' | 'renew' | null>(null);
  const [selectedService, setSelectedService] = useState<any>(null);
  const [isSubmittingService, setIsSubmittingService] = useState(false);
  const [serviceFormData, setServiceFormData] = useState({
    customerId: '', contractId: '', loaiDichVu: '', trangThai: 'Active', cpNameCode: '', brandNameOA: '', 
    thoiHanBrand: '', dauSo: '', cuPhap: '', quocGia: '', ketNoiAPIGateway: '', ketNoiSMPP: '', ketNoiAPIGapOne: '', 
    ketNoiViZCA: '', ketNoiHeThongKH: '', tenService: '', supPhuTrach: '', ngayBatDau: '', ngayHetHan: '', ghiChu: '', actorEmail: ''
  });

  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchData();
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

  async function fetchData() {
    setLoading(true);
    const [res, configsRes, custRes] = await Promise.all([
      getContracts(),
      getDropdownConfigs(),
      getCustomers()
    ]);
    
    if (configsRes.success && configsRes.data) {
      setLookups(configsRes.data);
    }
    
    if (custRes.success && custRes.data) {
      setCustomers(custRes.data);
    }
    
    if (res.success && res.data) {
      setContracts(res.data);
      
      const params = new URLSearchParams(window.location.search);
      const editId = params.get('edit');
      if (editId) {
        const contractToEdit = res.data.find((c: any) => c.contract_id === editId);
        if (contractToEdit) {
          setSelectedContract(contractToEdit);
          setFormData({
            customerId: contractToEdit.customer_id || '',
            soHopDong: contractToEdit.so_hop_dong || '',
            soPO: contractToEdit.so_po || '',
            ngayBatDauHD: contractToEdit.ngay_bat_dau_hd || '',
            ngayKetThucHD: contractToEdit.ngay_ket_thuc_hd || '',
            ngayBatDauPO: contractToEdit.ngay_bat_dau_po || '',
            ngayKetThucPO: contractToEdit.ngay_ket_thuc_po || '',
            hinhThucThanhToan: contractToEdit.hinh_thuc_thanh_toan || '',
            previousContractId: contractToEdit.previous_contract_id || '',
            actorEmail: contractToEdit.created_by || '',
            trangThai: contractToEdit.trang_thai || 'Active',
            tuDongGiaHan: !!contractToEdit.tu_dong_gia_han,
            chuKyGiaHan: contractToEdit.chu_ky_gia_han || ''
          });
          setActiveModal('edit');
          // Xoá param edit khỏi url để không bị mở lại khi refresh
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

  const getStatusBadge = (status: string) => {
    const s = (status || '').toLowerCase();
    if (s === 'active') return <span className="badge-custom badge-success" style={{ padding: '4px 8px', fontSize: '12px' }}>Active</span>;
    if (s === 'expired') return <span className="badge-custom badge-error" style={{ padding: '4px 8px', fontSize: '12px' }}>Expired</span>;
    if (s === 'expiring') return <span className="badge-custom badge-warning" style={{ padding: '4px 8px', fontSize: '12px' }}>Expiring</span>;
    if (s === 'cancelled') return <span className="badge-custom badge-default" style={{ padding: '4px 8px', fontSize: '12px' }}>Cancelled</span>;
    return <span className="badge-custom badge-default" style={{ padding: '4px 8px', fontSize: '12px' }}>{status}</span>;
  };

  // Derived unique lists for dropdowns
  const uniqueStatus = ['Active', 'Expired', 'Expiring', 'Cancelled'];
  const availableCS = lookups.customerSuccess || [];
  const availableSUP = lookups.customerSupport || [];
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
      customerId: c.customer_id || '',
      soHopDong: c.so_hop_dong || '',
      soPO: c.so_po || '',
      ngayBatDauHD: c.ngay_bat_dau_hd || '',
      ngayKetThucHD: c.ngay_ket_thuc_hd || '',
      ngayBatDauPO: c.ngay_bat_dau_po || '',
      ngayKetThucPO: c.ngay_ket_thuc_po || '',
      hinhThucThanhToan: c.hinh_thuc_thanh_toan || '',
      previousContractId: c.previous_contract_id || '',
      actorEmail: c.created_by || '',
      trangThai: c.trang_thai || 'Active',
      tuDongGiaHan: !!c.tu_dong_gia_han,
      chuKyGiaHan: c.chu_ky_gia_han || ''
    });
    setActiveModal('edit');
  };

  const openRenewModal = (c: any) => {
    setSelectedContract(c);
    setFormData({
      customerId: c.customer_id || '',
      soHopDong: '',
      soPO: '',
      ngayBatDauHD: c.ngay_ket_thuc_hd || '', // default start is old end
      ngayKetThucHD: '',
      ngayBatDauPO: '',
      ngayKetThucPO: '',
      hinhThucThanhToan: c.hinh_thuc_thanh_toan || '',
      previousContractId: c.contract_id || '',
      actorEmail: userEmail || '',
      trangThai: 'Active',
      tuDongGiaHan: !!c.tu_dong_gia_han,
      chuKyGiaHan: c.chu_ky_gia_han || ''
    });
    setActiveModal('renew');
  };

  const openAddServiceModal = (c: any) => {
    setServiceFormData({
      customerId: c.customer_id || '', contractId: c.contract_id || '', loaiDichVu: '', trangThai: 'Active', cpNameCode: '', brandNameOA: '', 
      thoiHanBrand: '', dauSo: '', cuPhap: '', quocGia: '', ketNoiAPIGateway: '', ketNoiSMPP: '', ketNoiAPIGapOne: '', 
      ketNoiViZCA: '', ketNoiHeThongKH: '', tenService: '', supPhuTrach: '', ngayBatDau: '', ngayHetHan: '', ghiChu: '', actorEmail: userEmail || ''
    });
    setActiveServiceModal('add');
  };

  const openEditServiceModal = (s: any) => {
    setSelectedService(s);
    setServiceFormData({
      customerId: s.customer_id || '', contractId: s.contract_id || '', loaiDichVu: s.loai_dich_vu || '', trangThai: s.trang_thai || 'Active', 
      cpNameCode: s.cp_name_code || '', brandNameOA: s.brand_name_oa || '', thoiHanBrand: s.thoi_han_brand || '', dauSo: s.dau_so || '', cuPhap: s.cu_phap || '', 
      quocGia: s.quoc_gia || '', ketNoiAPIGateway: s.ket_noi_api_gateway || '', ketNoiSMPP: s.ket_noi_smpp || '', ketNoiAPIGapOne: s.ket_noi_api_gap_one || '', 
      ketNoiViZCA: s.ket_noi_vi_zca || '', ketNoiHeThongKH: s.ket_noi_he_thong_kh || '', tenService: s.ten_service || '', supPhuTrach: s.sup_phu_trach || '', 
      ngayBatDau: s.ngay_bat_dau || '', ngayHetHan: s.ngay_het_han || '', ghiChu: s.ghi_chu || '', actorEmail: s.created_by || ''
    });
    setActiveServiceModal('edit');
  };

  const openRenewServiceModal = (s: any) => {
    setSelectedService(s);
    setServiceFormData({
      customerId: s.customer_id || '', contractId: s.contract_id || '', loaiDichVu: s.loai_dich_vu || '', trangThai: 'Active', 
      cpNameCode: s.cp_name_code || '', brandNameOA: s.brand_name_oa || '', thoiHanBrand: '', dauSo: s.dau_so || '', cuPhap: s.cu_phap || '', 
      quocGia: s.quoc_gia || '', ketNoiAPIGateway: s.ket_noi_api_gateway || '', ketNoiSMPP: s.ket_noi_smpp || '', ketNoiAPIGapOne: s.ket_noi_api_gap_one || '', 
      ketNoiViZCA: s.ket_noi_vi_zca || '', ketNoiHeThongKH: s.ket_noi_he_thong_kh || '', tenService: s.ten_service || '', supPhuTrach: s.sup_phu_trach || '', 
      ngayBatDau: s.ngay_het_han || '', ngayHetHan: '', ghiChu: s.ghi_chu || '', actorEmail: userEmail || ''
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
      } else if (activeModal === 'edit') {
        const payload = { ...formData, contractId: selectedContract.contract_id };
        const res = await updateContractInfo(payload);
        if (!res.success) throw new Error(res.error);
      } else if (activeModal === 'renew') {
        const { renewContract } = await import('@/lib/cx-actions');
        const payload = {
          type: 'contract',
          customerId: formData.customerId,
          contractIdCu: formData.previousContractId,
          soHopDong: formData.soHopDong,
          soPO: formData.soPO,
          ngayBatDauMoi: formData.ngayBatDauHD,
          ngayKetThucMoi: formData.ngayKetThucHD,
          ngayBatDauPO: formData.ngayBatDauPO,
          ngayKetThucPO: formData.ngayKetThucPO,
          hinhThucThanhToan: formData.hinhThucThanhToan,
          trangThai: formData.trangThai,
          tuDongGiaHan: formData.tuDongGiaHan,
          chuKyGiaHan: formData.tuDongGiaHan ? parseInt(formData.chuKyGiaHan) || null : null,
          actorEmail: userEmail
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
          type: 'service',
          targetId: selectedService.service_id,
          customerId: serviceFormData.customerId,
          ngayBatDauMoi: serviceFormData.ngayBatDau,
          ngayKetThucMoi: serviceFormData.ngayHetHan,
          actorEmail: userEmail,
          ghiChu: serviceFormData.ghiChu
        };
        const res = await renewContract(payload);
        if (!res.success) throw new Error(res.error);
      }
      
      // Reload expanded row data
      if (expandedRow) {
        setLoadingExpanded(true);
        const [servRes, contRes] = await Promise.all([
          getServicesByContractId(expandedRow),
          getContractsByCustomerId(serviceFormData.customerId)
        ]);
        setExpandedData({
          services: servRes.success && servRes.data ? servRes.data : [],
          relatedContracts: contRes.success && contRes.data ? contRes.data.filter((x: any) => x.contract_id !== expandedRow) : []
        });
        setLoadingExpanded(false);
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
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 700, color: 'var(--neutral-900)', margin: 0 }}>Quản lý Hợp đồng / PO</h1>
        <button className="btn btn-primary" onClick={openAddModal} style={{ padding: '10px 20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Plus size={18} /> Thêm mới
        </button>
      </div>

      {/* Filter Bar */}
      <div className="card-container p-6 mb-6" style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', alignItems: 'flex-end', zIndex: 10, position: 'relative', boxShadow: 'var(--shadow-md)', overflow: 'visible' }} ref={dropdownRef}>
        <div style={{ flex: '1 1 200px' }}>
          <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '8px', color: 'var(--neutral-700)' }}>
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

        {/* Status Dropdown */}
        <div style={{ position: 'relative', flex: '1 1 180px' }}>
          <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '8px', color: 'var(--neutral-700)' }}>Trạng thái</label>
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

        {/* CS Dropdown */}
        <div style={{ position: 'relative', flex: '1 1 180px' }}>
          <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '8px', color: 'var(--neutral-700)' }}>Customer Success</label>
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


        {/* Sale Dropdown */}
        <div style={{ position: 'relative', flex: '1 1 180px' }}>
          <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '8px', color: 'var(--neutral-700)' }}>Tên Sale</label>
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

      <div className="card-container" style={{ overflow: 'hidden', boxShadow: 'var(--shadow-md)' }}>
        {loading ? (
          <div style={{ padding: '60px 40px', textAlign: 'center', color: 'var(--neutral-500)' }}>Đang tải dữ liệu...</div>
        ) : filteredContracts.length === 0 ? (
          <div style={{ padding: '60px 40px', textAlign: 'center', color: 'var(--neutral-500)' }}>Không có dữ liệu hợp đồng nào khớp với bộ lọc.</div>
        ) : (
          <table className="custom-table">
            <thead>
              <tr>
                <th>Mã KH</th>
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
                    <tr onClick={() => handleExpand(c)} style={{ cursor: 'pointer', background: isExpanded ? 'var(--neutral-50)' : 'transparent', transition: 'background 0.2s ease' }}>
                      <td style={{ fontWeight: 600, color: 'var(--primary-700)' }}>{c.customer_id}</td>
                      <td style={{ color: 'var(--neutral-900)' }}>{c.ten_cong_ty || '--'}</td>
                      <td style={{ color: 'var(--neutral-600)' }}>{c.org_id || '--'}</td>
                      <td style={{ color: 'var(--neutral-900)' }}>{c.so_hop_dong || '--'}</td>
                      <td>{formatDate(c.ngay_bat_dau_hd)}</td>
                      <td>{formatDate(c.ngay_ket_thuc_hd)}</td>
                      <td>{getStatusBadge(c.trang_thai)}</td>
                      <td>{c.cs_in_charge || '--'}</td>
                      <td>{c.sale_in_charge || '--'}</td>
                      <td style={{ textAlign: 'center' }}>
                        <span style={{ fontWeight: 600, color: 'var(--primary-600)', background: 'var(--primary-50)', padding: '4px 8px', borderRadius: '4px' }}>
                          {c.total_services || 0}
                        </span>
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                          <button className="btn btn-secondary" style={{ padding: '6px', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 'var(--radius-md)' }} onClick={(e) => { e.stopPropagation(); openEditModal(c); }} title="Sửa hợp đồng">
                            <Edit2 size={16} style={{ color: 'var(--gold-600)' }} />
                          </button>
                          <button className="btn btn-secondary" style={{ padding: '4px 8px', fontSize: '12px' }} onClick={(e) => { e.stopPropagation(); openRenewModal(c); }} title="Gia hạn hợp đồng">
                            Gia hạn
                          </button>
                        </div>
                      </td>
                    </tr>
                    {isExpanded && (
                      <tr className="accordion-row">
                        <td colSpan={11} style={{ background: 'var(--neutral-50)', padding: '16px 24px', borderBottom: '1px solid var(--neutral-200)' }}>
                          <div style={{ background: '#fff', padding: '20px', borderRadius: 'var(--radius-md)', boxShadow: 'var(--shadow-sm)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                              <h4 style={{ fontSize: '15px', fontWeight: 600, color: 'var(--neutral-900)', margin: 0 }}>Dịch vụ thuộc Hợp đồng</h4>
                              <div style={{ display: 'flex', gap: '8px' }}>
                                <button className="btn btn-primary" style={{ padding: '6px 12px', fontSize: '13px' }} onClick={() => openAddServiceModal(c)}>
                                  + Thêm dịch vụ
                                </button>
                              </div>
                            </div>
                            
                            {loadingExpanded ? (
                              <div style={{ fontSize: '13px', color: 'var(--neutral-500)' }}>Đang tải...</div>
                            ) : expandedData.services.length === 0 ? (
                              <div style={{ fontSize: '13px', color: 'var(--neutral-500)', fontStyle: 'italic' }}>Chưa có dịch vụ nào liên kết.</div>
                            ) : (
                              <div style={{ overflowX: 'auto' }}>
                                <table className="custom-table" style={{ fontSize: '13px' }}>
                                  <thead>
                                    <tr>
                                      <th>Mã DV</th>
                                      <th>Loại DV</th>
                                      <th>Brand/OA</th>
                                      <th>CPID</th>
                                      <th>Bắt đầu</th>
                                      <th>Hết hạn</th>
                                      <th>SUP</th>
                                      <th>Trạng thái</th>
                                      <th style={{ textAlign: 'center' }}>Thao tác</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {expandedData.services.map((s, idx) => (
                                      <tr key={idx} style={{ background: 'var(--neutral-50)' }}>
                                        <td style={{ fontWeight: 600, color: 'var(--primary-700)' }}>{s.service_id}</td>
                                        <td>{s.loai_dich_vu || '--'}</td>
                                        <td>{s.brand_name_oa || '--'}</td>
                                        <td>{s.cp_name_code || '--'}</td>
                                        <td>{formatDate(s.ngay_bat_dau)}</td>
                                        <td>{formatDate(s.ngay_het_han)}</td>
                                        <td>{s.sup_phu_trach || '--'}</td>
                                        <td>{getStatusBadge(s.trang_thai)}</td>
                                        <td style={{ textAlign: 'center' }}>
                                          <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                                            <button className="btn btn-secondary" style={{ padding: '4px 8px', fontSize: '12px' }} onClick={() => openRenewServiceModal(s)}>Gia hạn</button>
                                            <button className="btn btn-secondary" style={{ padding: '4px 8px', fontSize: '12px' }} onClick={() => openEditServiceModal(s)}>Sửa</button>
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
        )}
      </div>
    </div>

      {/* Modals */}
      {(activeModal === 'add' || activeModal === 'edit' || activeModal === 'renew') && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,0.4)', overflowY: 'auto', backdropFilter: 'blur(4px)' }}>
          <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 20px' }}>
            <div className="card-container animate-fade-in" style={{ width: '100%', maxWidth: '700px', padding: '32px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h2 style={{ fontSize: '20px', fontWeight: 700, margin: 0, color: 'var(--neutral-900)' }}>
                {activeModal === 'add' ? 'Thêm mới Hợp đồng' : activeModal === 'renew' ? 'Gia hạn Hợp đồng' : 'Chỉnh sửa Hợp đồng'}
              </h2>
              <button onClick={() => setActiveModal(null)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--neutral-400)' }}><X size={24} /></button>
            </div>
            
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label className="label-custom">Mã Khách Hàng <span className="text-error-600">*</span></label>
                  <select required className="input-field w-full" value={formData.customerId} onChange={e => setFormData({...formData, customerId: e.target.value})} disabled={activeModal === 'renew'}>
                    <option value="">-- Chọn Khách hàng --</option>
                    {customers.map(c => (
                      <option key={c.customer_id} value={c.customer_id}>{c.customer_id} - {c.ten_cong_ty}</option>
                    ))}
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
                <div>
                  <label className="label-custom">Số Hợp đồng</label>
                  <input className="input-field w-full" value={formData.soHopDong} onChange={e => setFormData({...formData, soHopDong: e.target.value})} />
                </div>
                <div>
                  <label className="label-custom">Số PO</label>
                  <input className="input-field w-full" value={formData.soPO} onChange={e => setFormData({...formData, soPO: e.target.value})} />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label className="label-custom">Ngày bắt đầu HĐ</label>
                  <input type="date" className="input-field w-full" value={formData.ngayBatDauHD} onChange={e => setFormData({...formData, ngayBatDauHD: e.target.value})} onClick={(e) => (e.target as any).showPicker && (e.target as any).showPicker()} />
                </div>
                <div>
                  <label className="label-custom">Ngày kết thúc HĐ</label>
                  <input type="date" className="input-field w-full" value={formData.ngayKetThucHD} onChange={e => setFormData({...formData, ngayKetThucHD: e.target.value})} onClick={(e) => (e.target as any).showPicker && (e.target as any).showPicker()} />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label className="label-custom">Ngày bắt đầu PO</label>
                  <input type="date" className="input-field w-full" value={formData.ngayBatDauPO} onChange={e => setFormData({...formData, ngayBatDauPO: e.target.value})} onClick={(e) => (e.target as any).showPicker && (e.target as any).showPicker()} />
                </div>
                <div>
                  <label className="label-custom">Ngày kết thúc PO</label>
                  <input type="date" className="input-field w-full" value={formData.ngayKetThucPO} onChange={e => setFormData({...formData, ngayKetThucPO: e.target.value})} onClick={(e) => (e.target as any).showPicker && (e.target as any).showPicker()} />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label className="label-custom">Hình thức thanh toán</label>
                  <input className="input-field w-full" value={formData.hinhThucThanhToan} onChange={e => setFormData({...formData, hinhThucThanhToan: e.target.value})} placeholder="VD: Tiền mặt, Chuyển khoản, Thẻ..." />
                </div>
                <div>
                  <label className="label-custom">Hợp đồng trước đó (Nếu có)</label>
                  <input className="input-field w-full" value={formData.previousContractId} onChange={e => setFormData({...formData, previousContractId: e.target.value})} placeholder="Nhập ID hợp đồng trước" />
                </div>
              </div>

              <div style={{ background: 'var(--neutral-50)', padding: '16px', borderRadius: '8px', border: '1px solid var(--neutral-200)', marginTop: '8px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontWeight: 600, color: 'var(--neutral-900)' }}>
                    <input 
                      type="checkbox" 
                      checked={formData.tuDongGiaHan} 
                      onChange={e => setFormData({...formData, tuDongGiaHan: e.target.checked})} 
                      style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                    />
                    Tự động gia hạn hợp đồng
                  </label>
                  
                  {formData.tuDongGiaHan && (
                    <div style={{ marginTop: '16px', display: 'flex', gap: '12px', alignItems: 'center', animation: 'fadeIn 0.2s ease-out' }}>
                      <div style={{ flex: 1 }}>
                        <label className="label-custom">Chu kỳ gia hạn (tháng) <span className="text-error-600">*</span></label>
                        <select required className="input-field w-full" value={formData.chuKyGiaHan} onChange={e => setFormData({...formData, chuKyGiaHan: e.target.value})}>
                          <option value="">Chọn chu kỳ</option>
                          <option value="1">1 tháng</option>
                          <option value="3">3 tháng</option>
                          <option value="6">6 tháng</option>
                          <option value="12">12 tháng (1 năm)</option>
                          <option value="24">24 tháng (2 năm)</option>
                        </select>
                      </div>
                      <div style={{ flex: 1, fontSize: '12px', color: 'var(--neutral-500)', paddingTop: '24px' }}>
                        * Hệ thống sẽ tự tạo HĐ mới và gia hạn dịch vụ tương ứng khi HĐ này sắp hết hạn.
                      </div>
                    </div>
                  )}
                </div>

              <div>
                <label className="label-custom">Người thực hiện (Email) <span className="text-error-600">*</span></label>
                <input required type="email" className="input-field w-full" value={formData.actorEmail} onChange={e => setFormData({...formData, actorEmail: e.target.value})} placeholder="Email người nhập liệu" disabled style={{ background: 'var(--neutral-100)', color: 'var(--neutral-600)', cursor: 'not-allowed' }} />
              </div>

              <div style={{ display: 'flex', gap: '12px', marginTop: '16px', paddingTop: '16px', borderTop: '1px solid var(--neutral-200)' }}>
                <button type="submit" disabled={isSubmitting} className="btn btn-primary" style={{ flex: 1, padding: '12px' }}>
                  {isSubmitting ? 'Đang lưu...' : activeModal === 'renew' ? 'Lưu Gia hạn Hợp đồng' : 'Lưu Hợp đồng'}
                </button>
                <button type="button" onClick={() => setActiveModal(null)} className="btn btn-secondary" style={{ flex: 1, padding: '12px' }}>
                  Hủy
                </button>
              </div>
            </form>
          </div>
        </div>
        </div>
      )}

      {/* Service Modal */}
      {(activeServiceModal === 'add' || activeServiceModal === 'edit' || activeServiceModal === 'renew') && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,0.4)', overflowY: 'auto', backdropFilter: 'blur(4px)' }}>
          <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 20px' }}>
            <div className="card-container animate-fade-in" style={{ width: '100%', maxWidth: '800px', padding: '32px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <h2 style={{ fontSize: '20px', fontWeight: 700, margin: 0, color: 'var(--neutral-900)' }}>
                  {activeServiceModal === 'add' ? 'Thêm mới Dịch vụ' : activeServiceModal === 'renew' ? 'Gia hạn Dịch vụ' : 'Chỉnh sửa Dịch vụ'}
                </h2>
                <button onClick={() => setActiveServiceModal(null)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--neutral-400)' }}><X size={24} /></button>
              </div>
              
              <form onSubmit={handleServiceSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {/* NHÓM 1: THÔNG TIN CHUNG */}
                <div style={{ background: '#fafafa', padding: '20px', borderRadius: '8px', border: '1px solid #e5e7eb', marginBottom: '16px' }}>
                  <h3 style={{ fontSize: '15px', fontWeight: 600, color: '#374151', marginBottom: '16px', borderBottom: '1px solid #e5e7eb', paddingBottom: '8px' }}>1. Thông tin chung</h3>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                    <div>
                      <label className="label-custom">Khách hàng <span className="text-error-600">*</span></label>
                      <select required className="input-field w-full" value={serviceFormData.customerId} onChange={e => setServiceFormData({...serviceFormData, customerId: e.target.value})} disabled={activeServiceModal === 'renew'}>
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

                {/* NHÓM 2: CHI TIẾT KẾT NỐI */}
                <div style={{ background: '#fafafa', padding: '20px', borderRadius: '8px', border: '1px solid #e5e7eb', marginBottom: '16px' }}>
                  <h3 style={{ fontSize: '15px', fontWeight: 600, color: '#374151', marginBottom: '16px', borderBottom: '1px solid #e5e7eb', paddingBottom: '8px' }}>2. Chi tiết nghiệp vụ</h3>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                    <div>
                      <label className="label-custom">CP Name/Mã kết nối</label>
                      <input className="input-field w-full" value={serviceFormData.cpNameCode} onChange={e => setServiceFormData({...serviceFormData, cpNameCode: e.target.value})} />
                    </div>
                    <div>
                      <label className="label-custom">Brand/OA</label>
                      <input className="input-field w-full" value={serviceFormData.brandNameOA} onChange={e => setServiceFormData({...serviceFormData, brandNameOA: e.target.value})} />
                    </div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
                    <div>
                      <label className="label-custom">Đầu số</label>
                      <input className="input-field w-full" value={serviceFormData.dauSo} onChange={e => setServiceFormData({...serviceFormData, dauSo: e.target.value})} />
                    </div>
                    <div>
                      <label className="label-custom">Cú pháp</label>
                      <input className="input-field w-full" value={serviceFormData.cuPhap} onChange={e => setServiceFormData({...serviceFormData, cuPhap: e.target.value})} />
                    </div>
                    <div>
                      <label className="label-custom">Quốc gia</label>
                      <input className="input-field w-full" value={serviceFormData.quocGia} onChange={e => setServiceFormData({...serviceFormData, quocGia: e.target.value})} />
                    </div>
                  </div>
                </div>

                {/* NHÓM 3: CẤU HÌNH KỸ THUẬT */}
                <div style={{ background: '#fafafa', padding: '20px', borderRadius: '8px', border: '1px solid #e5e7eb', marginBottom: '16px' }}>
                  <h3 style={{ fontSize: '15px', fontWeight: 600, color: '#374151', marginBottom: '16px', borderBottom: '1px solid #e5e7eb', paddingBottom: '8px' }}>3. Cấu hình kỹ thuật</h3>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                      <input type="checkbox" style={{ width: '16px', height: '16px' }} checked={serviceFormData.ketNoiAPIGateway === 'Có'} onChange={e => setServiceFormData({...serviceFormData, ketNoiAPIGateway: e.target.checked ? 'Có' : ''})} />
                      <span className="label-custom" style={{ margin: 0, cursor: 'pointer' }}>API Gateway</span>
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                      <input type="checkbox" style={{ width: '16px', height: '16px' }} checked={serviceFormData.ketNoiSMPP === 'Có'} onChange={e => setServiceFormData({...serviceFormData, ketNoiSMPP: e.target.checked ? 'Có' : ''})} />
                      <span className="label-custom" style={{ margin: 0, cursor: 'pointer' }}>Kết nối SMPP</span>
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                      <input type="checkbox" style={{ width: '16px', height: '16px' }} checked={serviceFormData.ketNoiAPIGapOne === 'Có'} onChange={e => setServiceFormData({...serviceFormData, ketNoiAPIGapOne: e.target.checked ? 'Có' : ''})} />
                      <span className="label-custom" style={{ margin: 0, cursor: 'pointer' }}>API GapOne</span>
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                      <input type="checkbox" style={{ width: '16px', height: '16px' }} checked={serviceFormData.ketNoiViZCA === 'Có'} onChange={e => setServiceFormData({...serviceFormData, ketNoiViZCA: e.target.checked ? 'Có' : ''})} />
                      <span className="label-custom" style={{ margin: 0, cursor: 'pointer' }}>Ví ZCA</span>
                    </label>
                  </div>
                  <div>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', marginBottom: '8px' }}>
                      <input type="checkbox" style={{ width: '16px', height: '16px' }} checked={!!serviceFormData.ketNoiHeThongKH} onChange={e => setServiceFormData({...serviceFormData, ketNoiHeThongKH: e.target.checked ? 'Có' : ''})} />
                      <span className="label-custom" style={{ margin: 0, cursor: 'pointer' }}>Tích hợp Hệ thống Khách hàng</span>
                    </label>
                    {!!serviceFormData.ketNoiHeThongKH && (
                      <input className="input-field w-full animate-fade-in" value={serviceFormData.ketNoiHeThongKH} onChange={e => setServiceFormData({...serviceFormData, ketNoiHeThongKH: e.target.value})} placeholder="Nhập tên/thông tin hệ thống KH..." style={{ marginTop: '8px' }} />
                    )}
                  </div>
                </div>

                {/* NHÓM 4: THỜI GIAN & GHI CHÚ */}
                <div style={{ background: '#fafafa', padding: '20px', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
                  <h3 style={{ fontSize: '15px', fontWeight: 600, color: '#374151', marginBottom: '16px', borderBottom: '1px solid #e5e7eb', paddingBottom: '8px' }}>4. Thời gian & Ghi chú</h3>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                    <div>
                      <label className="label-custom">Ngày bắt đầu</label>
                      <input type="date" className="input-field w-full" value={serviceFormData.ngayBatDau} onChange={e => setServiceFormData({...serviceFormData, ngayBatDau: e.target.value})} onClick={(e) => (e.target as any).showPicker && (e.target as any).showPicker()} />
                    </div>
                    <div>
                      <label className="label-custom">Ngày hết hạn</label>
                      <input type="date" className="input-field w-full" value={serviceFormData.ngayHetHan} onChange={e => setServiceFormData({...serviceFormData, ngayHetHan: e.target.value})} onClick={(e) => (e.target as any).showPicker && (e.target as any).showPicker()} />
                    </div>
                  </div>
                  <div>
                    <label className="label-custom" style={{ marginBottom: '8px', display: 'block' }}>Ghi chú bổ sung</label>
                    <textarea className="input-field w-full" rows={3} value={serviceFormData.ghiChu} onChange={e => setServiceFormData({...serviceFormData, ghiChu: e.target.value})} placeholder="Nhập ghi chú..." style={{ resize: 'vertical' }} />
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '12px', marginTop: '16px', paddingTop: '16px', borderTop: '1px solid var(--neutral-200)' }}>
                  <button type="submit" disabled={isSubmittingService} className="btn btn-primary" style={{ flex: 1, padding: '12px' }}>
                    {isSubmittingService ? 'Đang lưu...' : activeServiceModal === 'renew' ? 'Lưu Gia hạn' : 'Lưu Dịch vụ'}
                  </button>
                  <button type="button" onClick={() => setActiveServiceModal(null)} className="btn btn-secondary" style={{ flex: 1, padding: '12px' }}>
                    Hủy
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

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