"use client";

import { useState, useEffect } from "react";
import { Search, RotateCcw, Clock, Target, User } from "lucide-react";
import { supabase } from "@/lib/supabase";

export default function HistoryPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTarget, setSearchTarget] = useState('');

  const fetchLogs = async () => {
    setLoading(true);
    try {
      let query = supabase.from('cx_activity_logs').select('*').order('created_at', { ascending: false }).limit(200);
      
      if (searchTarget) {
        query = query.or(`target_id.ilike.%${searchTarget}%,detail.ilike.%${searchTarget}%`);
      }

      const { data, error } = await query;
      if (error) throw error;
      setLogs(data || []);
    } catch (err) {
      console.error("Fetch logs error:", err);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchLogs();
  };

  const getActionColorClass = (action: string) => {
    switch (action) {
      case 'CREATE': 
      case 'ACTIVATE': 
        return { bg: 'var(--success-50)', color: 'var(--success-700)', border: 'var(--success-200)' };
      case 'UPDATE': 
      case 'RENEW': 
        return { bg: 'var(--primary-50)', color: 'var(--primary-700)', border: 'var(--primary-200)' };
      case 'DELETE': 
      case 'CANCEL': 
        return { bg: 'var(--error-50)', color: 'var(--error-700)', border: 'var(--error-200)' };
      default: 
        return { bg: 'var(--neutral-100)', color: 'var(--neutral-700)', border: 'var(--neutral-200)' };
    }
  };

  return (
    <div className="animate-fade-in" style={{ padding: '0 0 40px 0' }}>
      <div className="page-header" style={{ marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: 'var(--text-2xl)', fontWeight: 800, color: 'var(--neutral-900)', margin: '0 0 4px 0' }}>
            Lịch sử hoạt động
          </h1>
          <p style={{ fontSize: 'var(--text-sm)', color: 'var(--neutral-500)', margin: 0 }}>
            Tra cứu lịch sử thao tác trên hệ thống (200 bản ghi gần nhất).
          </p>
        </div>
      </div>

      <div className="card-container animate-fade-in-down" style={{ padding: '24px' }}>
        {/* Toolbar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: '16px', marginBottom: '20px' }}>
          <form onSubmit={handleSearch} style={{ display: 'flex', gap: '12px', flex: 1, maxWidth: '400px' }}>
            <div style={{ position: 'relative', flex: 1 }}>
              <Search size={18} color="var(--neutral-400)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
              <input 
                type="text" 
                className="input-field w-full" 
                placeholder="Tìm theo ID hoặc nội dung..." 
                style={{ paddingLeft: '38px', height: '40px' }}
                value={searchTarget}
                onChange={(e) => setSearchTarget(e.target.value)}
              />
            </div>
            <button type="submit" className="btn btn-primary" style={{ padding: '0 20px', height: '40px' }}>Tìm</button>
          </form>
          <button onClick={() => { setSearchTarget(''); fetchLogs(); }} className="btn btn-secondary" style={{ height: '40px', padding: '0 16px' }}>
            <RotateCcw size={16} /> LÀM MỚI
          </button>
        </div>

        {/* Table */}
        <div className="table-wrapper">
          <table className="table-custom">
            <thead>
              <tr>
                <th style={{ width: '180px' }}><div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Clock size={14} /> THỜI GIAN</div></th>
                <th style={{ width: '120px' }}>HÀNH ĐỘNG</th>
                <th style={{ width: '150px' }}><div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Target size={14} /> ĐỐI TƯỢNG</div></th>
                <th>CHI TIẾT</th>
                <th style={{ width: '180px' }}><div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><User size={14} /> NGƯỜI THỰC HIỆN</div></th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} style={{ textAlign: 'center', padding: '60px 20px' }}>
                    <div style={{ display: 'inline-block', width: '24px', height: '24px', border: '2px solid var(--primary-200)', borderTopColor: 'var(--primary-600)', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
                    <p style={{ marginTop: '12px', color: 'var(--neutral-500)', fontSize: '14px' }}>Đang tải dữ liệu...</p>
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--neutral-500)' }}>
                    Không có bản ghi nào phù hợp.
                  </td>
                </tr>
              ) : (
                logs.map((log) => {
                  const styleColors = getActionColorClass(log.action);
                  return (
                    <tr key={log.log_id} className="hover:bg-neutral-50 transition-colors">
                      <td style={{ color: 'var(--neutral-600)', fontSize: '13px' }}>
                        {new Date(log.created_at).toLocaleString('vi-VN', { 
                          year: 'numeric', month: '2-digit', day: '2-digit', 
                          hour: '2-digit', minute: '2-digit', second: '2-digit' 
                        })}
                      </td>
                      <td>
                        <span style={{ 
                          display: 'inline-flex', padding: '4px 10px', borderRadius: '100px', 
                          fontSize: '11px', fontWeight: 700, letterSpacing: '0.5px',
                          color: styleColors.color,
                          background: styleColors.bg,
                          border: `1px solid ${styleColors.border}`
                        }}>
                          {log.action}
                        </span>
                      </td>
                      <td>
                        <span style={{ fontWeight: 600, color: 'var(--neutral-800)', fontSize: '13px' }}>
                          {log.target_type === 'customer' ? 'Khách hàng' : log.target_type === 'contract' ? 'Hợp đồng' : log.target_type === 'service' ? 'Dịch vụ' : log.target_type}
                        </span>
                        <div style={{ fontSize: '12px', color: 'var(--neutral-500)', marginTop: '2px', fontFamily: 'monospace' }}>
                          {log.target_id}
                        </div>
                      </td>
                      <td style={{ maxWidth: '300px' }}>
                        <div style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', color: 'var(--neutral-700)', fontSize: '14px' }} title={log.detail}>
                          {log.detail}
                        </div>
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'var(--primary-100)', color: 'var(--primary-700)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 600 }}>
                            {log.performed_by ? log.performed_by.charAt(0).toUpperCase() : '?'}
                          </div>
                          <span style={{ fontSize: '13px', color: 'var(--neutral-700)', fontWeight: 500 }} title={log.performed_by}>
                            {log.performed_by || 'system'}
                          </span>
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
