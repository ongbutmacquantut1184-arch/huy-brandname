"use client";

import { useState, useEffect } from "react";
import { Search, RotateCcw } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import Layout from "@/app/components/Layout";

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

  const getActionColor = (action: string) => {
    switch (action) {
      case 'CREATE': case 'ACTIVATE': return '#10b981'; // green
      case 'UPDATE': case 'RENEW': return '#3b82f6'; // blue
      case 'DELETE': case 'CANCEL': return '#ef4444'; // red
      default: return '#6b7280'; // gray
    }
  };

  return (
    <Layout>
      <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
          <div>
            <h1 style={{ fontSize: '24px', fontWeight: 700, color: 'var(--neutral-900)', marginBottom: '8px' }}>Lịch sử hoạt động</h1>
            <p style={{ color: 'var(--neutral-500)' }}>Tra cứu lịch sử thao tác trên hệ thống (200 bản ghi gần nhất).</p>
          </div>
        </div>

        <div className="card-container" style={{ padding: '24px' }}>
          {/* Toolbar */}
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: '16px', marginBottom: '20px' }}>
            <form onSubmit={handleSearch} style={{ display: 'flex', gap: '8px', flex: 1, maxWidth: '400px' }}>
              <div style={{ position: 'relative', flex: 1 }}>
                <Search size={18} color="var(--neutral-400)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                <input 
                  type="text" 
                  className="input-field" 
                  placeholder="Tìm theo ID hoặc nội dung..." 
                  style={{ paddingLeft: '38px', width: '100%' }}
                  value={searchTarget}
                  onChange={(e) => setSearchTarget(e.target.value)}
                />
              </div>
              <button type="submit" className="btn btn-primary" style={{ padding: '8px 16px' }}>Tìm</button>
            </form>
            <button onClick={() => { setSearchTarget(''); fetchLogs(); }} className="btn btn-secondary" style={{ padding: '8px 12px' }}>
              <RotateCcw size={18} /> LÀM MỚI
            </button>
          </div>

          {/* Table */}
          <div className="table-wrapper">
            <table className="table-custom">
              <thead>
                <tr>
                  <th style={{ width: '180px' }}>THỜI GIAN</th>
                  <th style={{ width: '120px' }}>HÀNH ĐỘNG</th>
                  <th style={{ width: '120px' }}>ĐỐI TƯỢNG</th>
                  <th>CHI TIẾT</th>
                  <th style={{ width: '150px' }}>NGƯỜI THỰC HIỆN</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={5} style={{ textAlign: 'center', padding: '40px' }}>
                      <div className="spinner"></div>
                      <p style={{ marginTop: '12px', color: 'var(--neutral-500)' }}>Đang tải dữ liệu...</p>
                    </td>
                  </tr>
                ) : logs.length === 0 ? (
                  <tr>
                    <td colSpan={5} style={{ textAlign: 'center', padding: '40px', color: 'var(--neutral-500)' }}>
                      Không có bản ghi nào.
                    </td>
                  </tr>
                ) : (
                  logs.map((log) => (
                    <tr key={log.id}>
                      <td style={{ color: 'var(--neutral-500)', fontSize: '13px' }}>
                        {new Date(log.created_at).toLocaleString('vi-VN', { 
                          year: 'numeric', month: '2-digit', day: '2-digit', 
                          hour: '2-digit', minute: '2-digit', second: '2-digit' 
                        })}
                      </td>
                      <td>
                        <span style={{ 
                          display: 'inline-flex', padding: '4px 10px', borderRadius: '100px', 
                          fontSize: '12px', fontWeight: 600, 
                          color: getActionColor(log.action),
                          background: `color-mix(in srgb, ${getActionColor(log.action)} 10%, transparent)`
                        }}>
                          {log.action}
                        </span>
                      </td>
                      <td>
                        <span style={{ fontWeight: 600, color: 'var(--neutral-700)' }}>
                          {log.target_type === 'customer' ? 'Khách hàng' : log.target_type === 'contract' ? 'Hợp đồng' : log.target_type === 'service' ? 'Dịch vụ' : log.target_type}
                        </span>
                        <div style={{ fontSize: '12px', color: 'var(--neutral-500)' }}>{log.target_id}</div>
                      </td>
                      <td style={{ maxWidth: '300px' }}>
                        <div style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={log.detail}>
                          {log.detail}
                        </div>
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: 'var(--primary-100)', color: 'var(--primary-700)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 600 }}>
                            {log.performed_by ? log.performed_by.charAt(0).toUpperCase() : '?'}
                          </div>
                          <span style={{ fontSize: '13px', color: 'var(--neutral-700)' }} title={log.performed_by}>
                            {log.performed_by || 'system'}
                          </span>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </Layout>
  );
}
