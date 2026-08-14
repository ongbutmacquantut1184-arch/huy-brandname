"use client";

import React, { useState, useEffect } from 'react';
import { getCustomersOverview } from '@/lib/cx-actions';
import { 
  Users, Server, FileText, AlertTriangle, LayoutDashboard, 
  UserCheck, Wrench, AlertOctagon, Database, ChevronRight
} from 'lucide-react';
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, 
  CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';

import KPICard from '@/components/ui/KPICard';
import Drawer from '@/components/ui/Drawer';
import DataTable from '@/components/ui/DataTable';
import StatusBadge from '@/components/ui/StatusBadge';
import SkeletonLoader from '@/components/ui/SkeletonLoader';

const COLORS = ['#24b47e', '#0070f3', '#f5a623', '#e30000', '#14b8a6', '#6366f1', '#8b5cf6'];
const STATUS_COLORS: Record<string, string> = {
  'Active': '#10B981', // emerald-500
  'Pending': '#F59E0B', // amber-500
  'Expired': '#EF4444', // red-500
  'Cancelled': '#6B7280', // gray-500
  'Inactive': '#9CA3AF' // gray-400
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

  const totalActiveCustomers = data.filter(c => c.trang_thai === 'Active').length;
  const totalActiveServices = allServices.filter(s => s.trang_thai === 'Active').length;
  const totalActiveContracts = allContracts.filter(c => c.trang_thai === 'Active').length;

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

  const csMap = new Map<string, any[]>();
  data.forEach(c => {
    const cs = c.customer_success || c.cs_in_charge || 'Chưa gán';
    if (!csMap.has(cs)) csMap.set(cs, []);
    csMap.get(cs)!.push(c);
  });
  const csLeaderboard = Array.from(csMap.entries()).map(([csName, customers]) => {
    const active = customers.filter(c => c.trang_thai === 'Active').length;
    let riskCount = 0;
    customers.forEach(c => {
      const cServices = c.services || [];
      const hasRisk = cServices.some((s: any) => {
        if (s.trang_thai !== 'Active') return false;
        const days = getDaysDiff(s.ngay_het_han);
        return days !== null && days <= 30; 
      });
      if (hasRisk) riskCount++;
    });
    return { csName, customers, total: customers.length, active, riskCount };
  }).sort((a, b) => b.total - a.total);

  const supMap = new Map<string, any[]>();
  allServices.forEach(s => {
    const sup = s.customer_support || 'Chưa gán';
    if (!supMap.has(sup)) supMap.set(sup, []);
    supMap.get(sup)!.push(s);
  });
  const supWorkload = Array.from(supMap.entries()).map(([supName, services]) => {
    const active = services.filter(s => s.trang_thai === 'Active').length;
    const pending = services.filter(s => s.trang_thai === 'Pending').length;
    const riskCount = services.filter(s => s.trang_thai === 'Active' && getDaysDiff(s.ngay_het_han) !== null && getDaysDiff(s.ngay_het_han)! <= 30).length;
    return { supName, services, total: services.length, active, pending, riskCount };
  }).sort((a, b) => b.total - a.total);

  const dqMissingSup = allServices.filter(s => !s.customer_support);
  const dqMissingExp = allServices.filter(s => !s.ngay_het_han);
  const dqMissingContract = allServices.filter(s => !s.contract_id);
  const contractIdsInServices = new Set(allServices.map(s => s.contract_id));
  const dqOrphanContracts = allContracts.filter(c => !contractIdsInServices.has(c.contract_id));

  // Columns for DataTables
  const csColumns = [
    { header: 'CS Phụ trách', accessor: (row: any) => <strong style={{ color: 'var(--neutral-900)' }}>{row.csName}</strong> },
    { header: 'Tổng KH', accessor: 'total' },
    { header: 'KH Active', accessor: (row: any) => <span style={{ color: 'var(--primary-600)', fontWeight: 600 }}>{row.active}</span> },
    { header: 'Có rủi ro', accessor: (row: any) => row.riskCount > 0 ? <StatusBadge status={`${row.riskCount} KH`} variant="warning" /> : <span style={{ color: 'var(--neutral-400)' }}>0</span> },
    { header: 'Chi tiết', align: 'center' as const, accessor: (row: any) => (
      <button className="btn btn-secondary" onClick={() => openDrawer(`Khách hàng của ${row.csName}`, 'cs', row.customers)}>
        Chi tiết <ChevronRight size={14} />
      </button>
    )}
  ];

  const supColumns = [
    { header: 'SUP Phụ trách', accessor: (row: any) => <strong style={{ color: 'var(--neutral-900)' }}>{row.supName}</strong> },
    { header: 'Tổng DV', accessor: 'total' },
    { header: 'Đang chạy', accessor: (row: any) => <span style={{ color: 'var(--info-600)', fontWeight: 600 }}>{row.active}</span> },
    { header: 'Chờ duyệt', accessor: (row: any) => <span style={{ color: 'var(--warning-600)', fontWeight: 600 }}>{row.pending}</span> },
    { header: 'Có rủi ro', accessor: (row: any) => row.riskCount > 0 ? <StatusBadge status={`${row.riskCount} DV`} variant="warning" /> : <span style={{ color: 'var(--neutral-400)' }}>0</span> },
    { header: 'Chi tiết', align: 'center' as const, accessor: (row: any) => (
      <button className="btn btn-secondary" onClick={() => openDrawer(`Dịch vụ của ${row.supName}`, 'sup', row.services)}>
        Chi tiết <ChevronRight size={14} />
      </button>
    )}
  ];

  if (loading) {
    return (
      <div style={{ padding: 'var(--space-8)' }}>
        <h1 className="text-2xl font-bold mb-6 text-neutral">Tổng quan Số liệu</h1>
        <SkeletonLoader rows={8} />
      </div>
    );
  }

  return (
    <div>
      <div className="page-header">
        <h1 className="text-2xl font-bold text-neutral m-0 flex items-center gap-3">
          <LayoutDashboard color="var(--primary-600)" /> Tổng quan Hệ thống
        </h1>
      </div>

      {/* Tabs */}
      <div className="flex gap-4 mb-8" style={{ borderBottom: '1px solid var(--neutral-200)', paddingBottom: '8px' }}>
        <button 
          className={`btn ${activeTab === 'overview' ? 'active-tab' : 'btn-secondary'}`}
          onClick={() => setActiveTab('overview')}
          style={activeTab === 'overview' ? { background: 'var(--primary-50)', color: 'var(--primary-700)', borderColor: 'var(--primary-200)' } : { border: 'none', background: 'transparent' }}
        >
          Toàn cảnh & Cảnh báo
        </button>
        <button 
          className={`btn ${activeTab === 'cs' ? 'active-tab' : 'btn-secondary'}`}
          onClick={() => setActiveTab('cs')}
          style={activeTab === 'cs' ? { background: 'var(--primary-50)', color: 'var(--primary-700)', borderColor: 'var(--primary-200)' } : { border: 'none', background: 'transparent' }}
        >
          Customer Success
        </button>
        <button 
          className={`btn ${activeTab === 'sup' ? 'active-tab' : 'btn-secondary'}`}
          onClick={() => setActiveTab('sup')}
          style={activeTab === 'sup' ? { background: 'var(--primary-50)', color: 'var(--primary-700)', borderColor: 'var(--primary-200)' } : { border: 'none', background: 'transparent' }}
        >
          Customer Support
        </button>
        <button 
          className={`btn ${activeTab === 'dq' ? 'active-tab' : 'btn-secondary'}`}
          onClick={() => setActiveTab('dq')}
          style={activeTab === 'dq' ? { background: 'var(--primary-50)', color: 'var(--primary-700)', borderColor: 'var(--primary-200)' } : { border: 'none', background: 'transparent' }}
        >
          Chất lượng Dữ liệu
        </button>
      </div>

      {/* TAB: OVERVIEW */}
      {activeTab === 'overview' && (
        <div className="animate-fade-in">
          <div className="grid gap-6 mb-8" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))' }}>
            <KPICard title="Khách hàng Đang hoạt động" value={totalActiveCustomers} icon={Users} color="var(--primary-600)" />
            <KPICard title="Dịch vụ Đang chạy" value={totalActiveServices} icon={Server} color="var(--info-600)" />
            <KPICard title="Hợp đồng Đang chạy" value={totalActiveContracts} icon={FileText} color="#8b5cf6" />
          </div>

          <div className="grid gap-6 mb-8" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(450px, 1fr))' }}>
            <div className="card-container p-6">
              <h3 className="text-base font-semibold mb-6 text-neutral">Cơ cấu Trạng thái Hợp đồng</h3>
              <div style={{ height: '280px' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={chartContractStatus} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={70} outerRadius={100} paddingAngle={2}>
                      {chartContractStatus.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={STATUS_COLORS[entry.name] || COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: 'var(--shadow-md)' }} />
                    <Legend iconType="circle" />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="card-container p-6">
              <h3 className="text-base font-semibold mb-6 text-neutral">Cơ cấu Trạng thái Dịch vụ</h3>
              <div style={{ height: '280px' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={chartServiceStatus} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={70} outerRadius={100} paddingAngle={2}>
                      {chartServiceStatus.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={STATUS_COLORS[entry.name] || COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: 'var(--shadow-md)' }} />
                    <Legend iconType="circle" />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          <h2 className="text-lg font-bold mb-4 flex items-center gap-2 text-warning-700">
            <AlertTriangle /> Cảnh báo rủi ro hết hạn (Active)
          </h2>
          <div className="grid gap-6" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(450px, 1fr))' }}>
            <div className="card-container p-6">
              <h3 className="text-base font-semibold mb-6 text-neutral">Hợp đồng theo mốc hết hạn</h3>
              <div style={{ height: '300px' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartContractBuckets} layout="vertical" margin={{ left: 50, right: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="var(--neutral-100)" />
                    <XAxis type="number" allowDecimals={false} />
                    <YAxis dataKey="name" type="category" tick={{ fontSize: 12 }} width={90} axisLine={false} tickLine={false} />
                    <Tooltip cursor={{ fill: 'var(--neutral-50)' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: 'var(--shadow-md)' }} />
                    <Bar dataKey="count" fill="var(--warning-500)" radius={[0, 4, 4, 0]} barSize={24}>
                      {chartContractBuckets.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.name === 'Quá hạn (< 0)' ? 'var(--error-500)' : 'var(--warning-500)'} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="card-container p-6">
              <h3 className="text-base font-semibold mb-6 text-neutral">Dịch vụ theo mốc hết hạn</h3>
              <div style={{ height: '300px' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartServiceBuckets} layout="vertical" margin={{ left: 50, right: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="var(--neutral-100)" />
                    <XAxis type="number" allowDecimals={false} />
                    <YAxis dataKey="name" type="category" tick={{ fontSize: 12 }} width={90} axisLine={false} tickLine={false} />
                    <Tooltip cursor={{ fill: 'var(--neutral-50)' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: 'var(--shadow-md)' }} />
                    <Bar dataKey="count" fill="var(--info-500)" radius={[0, 4, 4, 0]} barSize={24}>
                      {chartServiceBuckets.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.name === 'Quá hạn (< 0)' ? 'var(--error-500)' : 'var(--info-500)'} />
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
        <div className="animate-fade-in">
          <h3 className="text-lg font-bold mb-4 flex items-center gap-2"><UserCheck color="var(--primary-600)"/> Tải việc Customer Success theo Rủi ro</h3>
          <DataTable data={csLeaderboard} columns={csColumns} keyExtractor={(item) => item.csName} />
        </div>
      )}

      {/* TAB: SUP */}
      {activeTab === 'sup' && (
        <div className="animate-fade-in">
          <h3 className="text-lg font-bold mb-4 flex items-center gap-2"><Wrench color="var(--info-600)"/> Tải việc Support theo Rủi ro</h3>
          <DataTable data={supWorkload} columns={supColumns} keyExtractor={(item) => item.supName} />
        </div>
      )}

      {/* TAB: DATA QUALITY */}
      {activeTab === 'dq' && (
        <div className="animate-fade-in">
          <h3 className="text-lg font-bold mb-6 flex items-center gap-2"><Database color="var(--neutral-600)"/> Cảnh báo Chất lượng Dữ liệu</h3>
          <div className="grid gap-6 mb-6" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))' }}>
            <KPICard title="DV Thiếu SUP" value={dqMissingSup.length} icon={AlertOctagon} color="var(--error-600)" />
            <KPICard title="DV Thiếu Ngày hết hạn" value={dqMissingExp.length} icon={AlertOctagon} color="var(--error-600)" />
            <KPICard title="DV Thiếu Hợp đồng" value={dqMissingContract.length} icon={AlertTriangle} color="var(--warning-600)" />
            <KPICard title="HĐ Mồ côi (Không DV)" value={dqOrphanContracts.length} icon={AlertTriangle} color="var(--warning-600)" />
          </div>
        </div>
      )}

      {/* DRILL-DOWN DRAWER */}
      <Drawer isOpen={isDrawerOpen} onClose={() => setIsDrawerOpen(false)} title={drawerData.title} width="600px">
        {drawerData.type === 'cs' && (
          <div className="flex-col gap-4">
            {drawerData.list.map((c, i) => (
              <div key={i} className="card-container p-4" style={{ border: '1px solid var(--neutral-200)', marginBottom: '12px' }}>
                <div className="flex justify-between items-start mb-2">
                  <div style={{ fontWeight: 600, color: 'var(--primary-700)' }}>{c.ten_cong_ty || 'Chưa có tên'}</div>
                  <StatusBadge status={c.trang_thai === 'Active' ? 'Hoạt động' : 'Tạm ngưng'} variant={c.trang_thai === 'Active' ? 'success' : 'default'} />
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
              <div key={i} className="card-container p-4" style={{ border: '1px solid var(--neutral-200)', marginBottom: '12px' }}>
                <div className="flex justify-between items-start mb-2">
                  <div style={{ fontWeight: 600, color: 'var(--info-700)' }}>{s.loai_dich_vu || 'Không rõ'}</div>
                  <StatusBadge status={s.trang_thai} />
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
      </Drawer>
    </div>
  );
}
