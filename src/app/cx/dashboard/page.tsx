"use client";

import React, { useState, useEffect } from 'react';
import { getCustomersOverview } from '@/lib/cx-actions';
import { 
  Users, Server, FileText, AlertTriangle, LayoutDashboard, 
  UserCheck, Wrench, ChevronRight, X, AlertOctagon, Database
} from 'lucide-react';
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, 
  CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';

const COLORS = ['#24b47e', '#0070f3', '#f5a623', '#e30000', '#14b8a6', '#6366f1', '#8b5cf6'];
const STATUS_COLORS: Record<string, string> = {
  'Active': '#24b47e',
  'Pending': '#f5a623',
  'Expired': '#e30000',
  'Cancelled': '#64748b',
  'Inactive': '#94a3b8'
};

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any[]>([]);
  
  // Drawer states
  const [drawerData, setDrawerData] = useState<{title: string, type: 'cs' | 'sup' | 'data', list: any[]}>({ title: '', type: 'cs', list: [] });
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      const res = await getCustomersOverview();
      if (res.success && res.data) {
        setData(res.data);
      }
      setLoading(false);
    }
    fetchData();
  }, []);

  const openDrawer = (title: string, type: 'cs' | 'sup' | 'data', list: any[]) => {
    setDrawerData({ title, type, list });
    setIsDrawerOpen(true);
  };

  // --- CALCULATION LOGIC ---
  const allServices = data.flatMap(c => c.services || []);
  const allContracts = data.flatMap(c => c.contracts || []);
  const now = new Date();
  
  // Helper for buckets
  const getDaysDiff = (dateStr: string) => {
    if (!dateStr) return null;
    const d = new Date(dateStr);
    const diffTime = d.getTime() - now.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const getBucket = (days: number) => {
    if (days < 0) return 'Quá hạn (< 0)';
    if (days <= 7) return '0-7 ngày';
    if (days <= 15) return '8-15 ngày';
    if (days <= 30) return '16-30 ngày';
    if (days <= 60) return '31-60 ngày';
    return '> 60 ngày';
  };

  const bucketOrder = ['Quá hạn (< 0)', '0-7 ngày', '8-15 ngày', '16-30 ngày', '31-60 ngày', '> 60 ngày'];

  // 1. Overview Basics
  const totalActiveCustomers = data.filter(c => c.trang_thai === 'Active').length;
  const totalActiveServices = allServices.filter(s => s.trang_thai === 'Active').length;
  const totalActiveContracts = allContracts.filter(c => c.trang_thai === 'Active').length;

  // 2. Status Charts
  const contractStatusMap: Record<string, number> = {};
  allContracts.forEach(c => {
    const st = c.trang_thai || 'Unknown';
    contractStatusMap[st] = (contractStatusMap[st] || 0) + 1;
  });
  const chartContractStatus = Object.keys(contractStatusMap).map(k => ({ name: k, value: contractStatusMap[k] }));

  const serviceStatusMap: Record<string, number> = {};
  allServices.forEach(s => {
    const st = s.trang_thai || 'Unknown';
    serviceStatusMap[st] = (serviceStatusMap[st] || 0) + 1;
  });
  const chartServiceStatus = Object.keys(serviceStatusMap).map(k => ({ name: k, value: serviceStatusMap[k] }));

  // 3. Expiration Buckets (Active only)
  const contractBuckets: Record<string, number> = { 'Quá hạn (< 0)': 0, '0-7 ngày': 0, '8-15 ngày': 0, '16-30 ngày': 0, '31-60 ngày': 0, '> 60 ngày': 0 };
  allContracts.filter(c => c.trang_thai === 'Active' && c.ngay_ket_thuc_hd).forEach(c => {
    const days = getDaysDiff(c.ngay_ket_thuc_hd);
    if (days !== null) contractBuckets[getBucket(days)]++;
  });
  const chartContractBuckets = bucketOrder.map(b => ({ name: b, count: contractBuckets[b] }));

  const serviceBuckets: Record<string, number> = { 'Quá hạn (< 0)': 0, '0-7 ngày': 0, '8-15 ngày': 0, '16-30 ngày': 0, '31-60 ngày': 0, '> 60 ngày': 0 };
  allServices.filter(s => s.trang_thai === 'Active' && (s.effective_service_end || s.ngay_het_han)).forEach(s => {
    const days = getDaysDiff(s.effective_service_end || s.ngay_het_han);
    if (days !== null) serviceBuckets[getBucket(days)]++;
  });
  const chartServiceBuckets = bucketOrder.map(b => ({ name: b, count: serviceBuckets[b] }));

  // 4. CS Workload
  const csMap = new Map<string, any[]>();
  data.forEach(c => {
    const cs = c.customer_success || c.cs_in_charge || 'Chưa gán';
    if (!csMap.has(cs)) csMap.set(cs, []);
    csMap.get(cs)!.push(c);
  });
  const csLeaderboard = Array.from(csMap.entries()).map(([csName, customers]) => {
    const active = customers.filter(c => c.trang_thai === 'Active').length;
    // Calculate risk
    let riskCount = 0;
    customers.forEach(c => {
      const cServices = c.services || [];
      const hasRisk = cServices.some((s: any) => {
        if (s.trang_thai !== 'Active') return false;
        const days = getDaysDiff(s.ngay_het_han);
        return days !== null && days <= 30; // Quá hạn hoặc hết hạn trong 30 ngày
      });
      if (hasRisk) riskCount++;
    });

    return {
      csName, customers, total: customers.length, active, riskCount
    };
  }).sort((a, b) => b.total - a.total);

  // 5. SUP Workload
  const supMap = new Map<string, any[]>();
  allServices.forEach(s => {
    const sup = s.sup_phu_trach || 'Chưa gán';
    if (!supMap.has(sup)) supMap.set(sup, []);
    supMap.get(sup)!.push(s);
  });
  const supWorkload = Array.from(supMap.entries()).map(([supName, services]) => {
    const active = services.filter(s => s.trang_thai === 'Active').length;
    const pending = services.filter(s => s.trang_thai === 'Pending').length;
    const riskCount = services.filter(s => s.trang_thai === 'Active' && getDaysDiff(s.ngay_het_han) !== null && getDaysDiff(s.ngay_het_han)! <= 30).length;

    return {
      supName, services, total: services.length, active, pending, riskCount
    };
  }).sort((a, b) => b.total - a.total);

  // 6. Data Quality
  const dqMissingSup = allServices.filter(s => !s.sup_phu_trach);
  const dqMissingExp = allServices.filter(s => !s.ngay_het_han);
  const dqMissingContract = allServices.filter(s => !s.contract_id);
  const contractIdsInServices = new Set(allServices.map(s => s.contract_id));
  const dqOrphanContracts = allContracts.filter(c => !contractIdsInServices.has(c.contract_id));

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '1400px', margin: '40px auto', padding: '0 24px', position: 'relative' }}>
      <h1 className="text-2xl font-bold text-neutral m-0 mb-6 flex items-center gap-3">
        <LayoutDashboard /> Tổng quan Số liệu
      </h1>

      {/* Tabs */}
      <div className="flex gap-4 mb-8" style={{ borderBottom: '1px solid var(--neutral-200)', paddingBottom: '8px' }}>
        <button 
          className={`btn ${activeTab === 'overview' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setActiveTab('overview')}
          style={{ background: activeTab === 'overview' ? 'var(--primary-600)' : 'transparent', color: activeTab === 'overview' ? '#fff' : 'var(--neutral-700)', border: 'none', boxShadow: 'none', fontWeight: 600 }}
        >
          Toàn cảnh & Cảnh báo
        </button>
        <button 
          className={`btn ${activeTab === 'cs' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setActiveTab('cs')}
          style={{ background: activeTab === 'cs' ? 'var(--primary-600)' : 'transparent', color: activeTab === 'cs' ? '#fff' : 'var(--neutral-700)', border: 'none', boxShadow: 'none', fontWeight: 600 }}
        >
          Customer Success
        </button>
        <button 
          className={`btn ${activeTab === 'sup' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setActiveTab('sup')}
          style={{ background: activeTab === 'sup' ? 'var(--primary-600)' : 'transparent', color: activeTab === 'sup' ? '#fff' : 'var(--neutral-700)', border: 'none', boxShadow: 'none', fontWeight: 600 }}
        >
          Customer Support
        </button>
        <button 
          className={`btn ${activeTab === 'dq' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setActiveTab('dq')}
          style={{ background: activeTab === 'dq' ? 'var(--primary-600)' : 'transparent', color: activeTab === 'dq' ? '#fff' : 'var(--neutral-700)', border: 'none', boxShadow: 'none', fontWeight: 600 }}
        >
          Chất lượng Dữ liệu
        </button>
      </div>

      {/* TAB: OVERVIEW */}
      {activeTab === 'overview' && (
        <div className="animate-fade-in-up">
          {/* Scorecards */}
          <div className="grid gap-6 mb-8" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))' }}>
            <div className="card-container p-6" style={{ background: 'var(--primary-50)', border: '1px solid var(--primary-200)' }}>
              <div className="flex justify-between items-center mb-4">
                <span style={{ color: 'var(--primary-700)', fontWeight: 600 }}>Khách hàng Đang hoạt động</span>
                <Users color="var(--primary-600)" size={24} />
              </div>
              <div style={{ fontSize: '36px', fontWeight: 800, color: 'var(--primary-800)' }}>
                {totalActiveCustomers}
              </div>
              <div className="text-sm mt-2" style={{ color: 'var(--primary-600)' }}>Trên tổng {data.length} KH</div>
            </div>

            <div className="card-container p-6" style={{ background: 'var(--info-50)', border: '1px solid var(--info-200)' }}>
              <div className="flex justify-between items-center mb-4">
                <span style={{ color: 'var(--info-700)', fontWeight: 600 }}>Dịch vụ Đang chạy</span>
                <Server color="var(--info-600)" size={24} />
              </div>
              <div style={{ fontSize: '36px', fontWeight: 800, color: 'var(--info-800)' }}>
                {totalActiveServices}
              </div>
              <div className="text-sm mt-2" style={{ color: 'var(--info-600)' }}>Trên tổng {allServices.length} DV</div>
            </div>

            <div className="card-container p-6" style={{ background: '#f5f3ff', border: '1px solid #ddd6fe' }}>
              <div className="flex justify-between items-center mb-4">
                <span style={{ color: '#6d28d9', fontWeight: 600 }}>Hợp đồng Đang chạy</span>
                <FileText color="#7c3aed" size={24} />
              </div>
              <div style={{ fontSize: '36px', fontWeight: 800, color: '#5b21b6' }}>
                {totalActiveContracts}
              </div>
              <div className="text-sm mt-2" style={{ color: '#7c3aed' }}>Trên tổng {allContracts.length} HĐ</div>
            </div>
          </div>

          {/* Charts: Status */}
          <div className="grid gap-6 mb-8" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(450px, 1fr))' }}>
            <div className="card-container p-6">
              <h3 className="text-lg font-bold mb-6 text-neutral">Cơ cấu Trạng thái Hợp đồng</h3>
              <div style={{ height: '250px' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={chartContractStatus} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={60} outerRadius={90} label>
                      {chartContractStatus.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={STATUS_COLORS[entry.name] || COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="card-container p-6">
              <h3 className="text-lg font-bold mb-6 text-neutral">Cơ cấu Trạng thái Dịch vụ</h3>
              <div style={{ height: '250px' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={chartServiceStatus} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={60} outerRadius={90} label>
                      {chartServiceStatus.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={STATUS_COLORS[entry.name] || COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Charts: Expiration Risk */}
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2" style={{ color: 'var(--warning-700)' }}><AlertTriangle /> Cảnh báo rủi ro hết hạn (Active)</h2>
          <div className="grid gap-6" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(450px, 1fr))' }}>
            <div className="card-container p-6">
              <h3 className="text-lg font-bold mb-6 text-neutral">Hợp đồng theo mốc hết hạn</h3>
              <div style={{ height: '300px' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartContractBuckets} layout="vertical" margin={{ left: 50, right: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="var(--neutral-200)" />
                    <XAxis type="number" allowDecimals={false} />
                    <YAxis dataKey="name" type="category" tick={{ fontSize: 13 }} width={100} />
                    <Tooltip cursor={{ fill: 'var(--neutral-100)' }} />
                    <Bar dataKey="count" fill="var(--warning-500)" radius={[0, 4, 4, 0]}>
                      {chartContractBuckets.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.name === 'Quá hạn (< 0)' ? 'var(--danger-500)' : 'var(--warning-500)'} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="card-container p-6">
              <h3 className="text-lg font-bold mb-6 text-neutral">Dịch vụ theo mốc hết hạn</h3>
              <div style={{ height: '300px' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartServiceBuckets} layout="vertical" margin={{ left: 50, right: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="var(--neutral-200)" />
                    <XAxis type="number" allowDecimals={false} />
                    <YAxis dataKey="name" type="category" tick={{ fontSize: 13 }} width={100} />
                    <Tooltip cursor={{ fill: 'var(--neutral-100)' }} />
                    <Bar dataKey="count" fill="var(--info-500)" radius={[0, 4, 4, 0]}>
                      {chartServiceBuckets.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.name === 'Quá hạn (< 0)' ? 'var(--danger-500)' : 'var(--info-500)'} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB: CS */}
      {activeTab === 'cs' && (
        <div className="animate-fade-in-up card-container p-6">
          <h3 className="text-lg font-bold mb-6 flex items-center gap-2"><UserCheck /> Tải việc Customer Success theo Rủi ro</h3>
          <table className="custom-table">
            <thead>
              <tr>
                <th>CS Phụ trách</th>
                <th>Tổng Khách hàng</th>
                <th>KH Active</th>
                <th><span style={{ color: 'var(--warning-700)' }}>KH Có rủi ro (Hết hạn ≤ 30 ngày)</span></th>
                <th style={{ textAlign: 'center' }}>Chi tiết</th>
              </tr>
            </thead>
            <tbody>
              {csLeaderboard.map((item, idx) => (
                <tr key={idx} className="row-hover">
                  <td style={{ fontWeight: 600, color: 'var(--neutral-900)' }}>{item.csName}</td>
                  <td>{item.total}</td>
                  <td style={{ color: 'var(--primary-600)', fontWeight: 600 }}>{item.active}</td>
                  <td>
                    {item.riskCount > 0 ? (
                      <span className="badge-custom" style={{ background: 'var(--warning-50)', color: 'var(--warning-700)', fontWeight: 700 }}>
                        {item.riskCount} KH
                      </span>
                    ) : (
                      <span style={{ color: 'var(--neutral-400)' }}>0</span>
                    )}
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    <button 
                      className="btn btn-secondary" 
                      onClick={() => openDrawer(`Khách hàng của ${item.csName}`, 'cs', item.customers)}
                      style={{ padding: '6px 12px', fontSize: '13px' }}
                    >
                      Xem chi tiết <ChevronRight size={14} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* TAB: SUP */}
      {activeTab === 'sup' && (
        <div className="animate-fade-in-up card-container p-6">
          <h3 className="text-lg font-bold mb-6 flex items-center gap-2"><Wrench /> Tải việc Support theo Rủi ro</h3>
          <table className="custom-table">
            <thead>
              <tr>
                <th>Support Phụ trách</th>
                <th>Tổng Dịch vụ</th>
                <th>DV Đang chạy (Active)</th>
                <th>DV Chờ (Pending)</th>
                <th><span style={{ color: 'var(--warning-700)' }}>DV Có rủi ro (Hết hạn ≤ 30 ngày)</span></th>
                <th style={{ textAlign: 'center' }}>Chi tiết</th>
              </tr>
            </thead>
            <tbody>
              {supWorkload.map((item, idx) => (
                <tr key={idx} className="row-hover">
                  <td style={{ fontWeight: 600, color: 'var(--neutral-900)' }}>{item.supName}</td>
                  <td>{item.total}</td>
                  <td style={{ color: 'var(--info-600)', fontWeight: 600 }}>{item.active}</td>
                  <td style={{ color: 'var(--warning-600)', fontWeight: 600 }}>{item.pending}</td>
                  <td>
                    {item.riskCount > 0 ? (
                      <span className="badge-custom" style={{ background: 'var(--warning-50)', color: 'var(--warning-700)', fontWeight: 700 }}>
                        {item.riskCount} DV
                      </span>
                    ) : (
                      <span style={{ color: 'var(--neutral-400)' }}>0</span>
                    )}
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    <button 
                      className="btn btn-secondary" 
                      onClick={() => openDrawer(`Dịch vụ của ${item.supName}`, 'sup', item.services)}
                      style={{ padding: '6px 12px', fontSize: '13px' }}
                    >
                      Xem chi tiết <ChevronRight size={14} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* TAB: DATA QUALITY */}
      {activeTab === 'dq' && (
        <div className="animate-fade-in-up">
          <h3 className="text-lg font-bold mb-6 flex items-center gap-2"><Database /> Cảnh báo Chất lượng Dữ liệu</h3>
          
          <div className="grid gap-6 mb-6" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))' }}>
            <div className="card-container p-6" style={{ background: 'var(--danger-50)', border: '1px solid var(--danger-200)' }}>
              <div className="flex justify-between items-start mb-2">
                <span style={{ color: 'var(--danger-700)', fontWeight: 600, fontSize: '15px' }}>DV Thiếu SUP</span>
                <AlertOctagon color="var(--danger-600)" size={20} />
              </div>
              <div style={{ fontSize: '32px', fontWeight: 800, color: 'var(--danger-800)' }}>{dqMissingSup.length}</div>
            </div>

            <div className="card-container p-6" style={{ background: 'var(--danger-50)', border: '1px solid var(--danger-200)' }}>
              <div className="flex justify-between items-start mb-2">
                <span style={{ color: 'var(--danger-700)', fontWeight: 600, fontSize: '15px' }}>DV Thiếu Ngày hết hạn</span>
                <AlertOctagon color="var(--danger-600)" size={20} />
              </div>
              <div style={{ fontSize: '32px', fontWeight: 800, color: 'var(--danger-800)' }}>{dqMissingExp.length}</div>
            </div>

            <div className="card-container p-6" style={{ background: 'var(--warning-50)', border: '1px solid var(--warning-200)' }}>
              <div className="flex justify-between items-start mb-2">
                <span style={{ color: 'var(--warning-700)', fontWeight: 600, fontSize: '15px' }}>DV Thiếu Hợp đồng</span>
                <AlertTriangle color="var(--warning-600)" size={20} />
              </div>
              <div style={{ fontSize: '32px', fontWeight: 800, color: 'var(--warning-800)' }}>{dqMissingContract.length}</div>
            </div>

            <div className="card-container p-6" style={{ background: 'var(--warning-50)', border: '1px solid var(--warning-200)' }}>
              <div className="flex justify-between items-start mb-2">
                <span style={{ color: 'var(--warning-700)', fontWeight: 600, fontSize: '15px' }}>HĐ Mồ côi (Không DV)</span>
                <AlertTriangle color="var(--warning-600)" size={20} />
              </div>
              <div style={{ fontSize: '32px', fontWeight: 800, color: 'var(--warning-800)' }}>{dqOrphanContracts.length}</div>
            </div>
          </div>
        </div>
      )}

      {/* DRILL-DOWN DRAWER */}
      {isDrawerOpen && (
        <>
          <div 
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 99998, backdropFilter: 'blur(2px)' }} 
            onClick={() => setIsDrawerOpen(false)} 
          />
          <div 
            className="animate-slide-in-right"
            style={{ position: 'fixed', top: 0, right: 0, bottom: 0, width: '600px', maxWidth: '100vw', background: '#fff', zIndex: 99999, boxShadow: 'var(--shadow-xl)', display: 'flex', flexDirection: 'column' }}
          >
            <div style={{ padding: '24px', borderBottom: '1px solid var(--neutral-200)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 className="text-xl font-bold m-0">{drawerData.title}</h2>
              <button onClick={() => setIsDrawerOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--neutral-500)' }}>
                <X size={24} />
              </button>
            </div>
            
            <div style={{ padding: '24px', overflowY: 'auto', flex: 1 }}>
              {drawerData.type === 'cs' && (
                <div className="flex-col gap-4">
                  {drawerData.list.map((c, i) => (
                    <div key={i} className="card-container p-4" style={{ border: '1px solid var(--neutral-200)' }}>
                      <div className="flex justify-between items-start mb-2">
                        <div style={{ fontWeight: 600, color: 'var(--primary-700)' }}>{c.ten_cong_ty || 'Chưa có tên'}</div>
                        <span className="badge-custom" style={{ background: c.trang_thai === 'Active' ? 'var(--primary-50)' : 'var(--neutral-100)', color: c.trang_thai === 'Active' ? 'var(--primary-700)' : 'var(--neutral-600)' }}>
                          {c.trang_thai === 'Active' ? 'Hoạt động' : 'Tạm ngưng'}
                        </span>
                      </div>
                      <div className="text-sm text-muted">Mã KH: {c.customer_id}</div>
                      <div className="text-sm text-muted mt-2">Đang sử dụng <strong>{c.active_services || 0}</strong> dịch vụ</div>
                    </div>
                  ))}
                </div>
              )}
              
              {drawerData.type === 'sup' && (
                <div className="flex-col gap-4">
                  {drawerData.list.map((s, i) => (
                    <div key={i} className="card-container p-4" style={{ border: '1px solid var(--neutral-200)' }}>
                      <div className="flex justify-between items-start mb-2">
                        <div style={{ fontWeight: 600, color: 'var(--info-700)' }}>{s.loai_dich_vu || 'Không rõ'}</div>
                        <span className="badge-custom" style={{ background: s.trang_thai === 'Active' ? 'var(--info-50)' : 'var(--neutral-100)', color: s.trang_thai === 'Active' ? 'var(--info-700)' : 'var(--neutral-600)' }}>
                          {s.trang_thai}
                        </span>
                      </div>
                      <div className="text-sm text-muted">Mã DV: {s.service_id}</div>
                      <div className="text-sm text-muted">Mã KH: {s.customer_id}</div>
                      {s.ngay_het_han && (
                        <div className="text-sm mt-2 font-semibold" style={{ color: getDaysDiff(s.ngay_het_han) !== null && getDaysDiff(s.ngay_het_han)! <= 30 ? 'var(--warning-700)' : 'var(--neutral-600)' }}>
                          Hết hạn: {new Date(s.ngay_het_han).toLocaleDateString('vi-VN')}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
