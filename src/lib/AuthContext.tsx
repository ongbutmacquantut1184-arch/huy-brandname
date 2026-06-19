"use client";

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { Mail, ArrowRight } from 'lucide-react';

interface AuthContextType {
  userEmail: string | null;
  login: (email: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType>({
  userEmail: null,
  login: () => {},
  logout: () => {},
});

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [isClient, setIsClient] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [emailInput, setEmailInput] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    setIsClient(true);
    const storedEmail = localStorage.getItem('cx_user_email');
    if (storedEmail) {
      setUserEmail(storedEmail);
    } else {
      setShowModal(true);
    }
  }, []);

  const login = (email: string) => {
    if (!email || !email.includes('@')) {
      setError('Vui lòng nhập một địa chỉ email hợp lệ.');
      return;
    }
    localStorage.setItem('cx_user_email', email);
    setUserEmail(email);
    setShowModal(false);
    setError('');
  };

  const logout = () => {
    localStorage.removeItem('cx_user_email');
    setUserEmail(null);
    setShowModal(true);
    setEmailInput('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    login(emailInput);
  };

  return (
    <AuthContext.Provider value={{ userEmail, login, logout }}>
      {children}
      
      {isClient && showModal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div className="animate-fade-in" style={{ width: '100%', maxWidth: '400px', background: '#ffffff', borderRadius: '24px', padding: '40px 32px', boxShadow: '0 20px 40px rgba(0,0,0,0.1)', textAlign: 'center' }}>
            <div style={{ width: '64px', height: '64px', background: 'var(--primary-50)', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px auto' }}>
              <Mail size={32} style={{ color: 'var(--primary-600)' }} />
            </div>
            
            <h2 style={{ fontSize: '24px', fontWeight: 700, color: '#111', marginBottom: '8px', letterSpacing: '-0.5px' }}>Đăng nhập</h2>
            <p style={{ color: 'var(--neutral-500)', fontSize: '15px', marginBottom: '32px' }}>Vui lòng nhập Email làm việc của bạn để lưu lịch sử thao tác trên hệ thống.</p>
            
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ position: 'relative' }}>
                <input 
                  type="email" 
                  autoFocus
                  placeholder="Nhập email của bạn..."
                  value={emailInput}
                  onChange={(e) => { setEmailInput(e.target.value); setError(''); }}
                  style={{ 
                    width: '100%', 
                    padding: '16px 20px', 
                    borderRadius: '12px', 
                    border: error ? '1px solid var(--error-500)' : '1px solid var(--neutral-200)',
                    fontSize: '16px',
                    outline: 'none',
                    transition: 'all 0.2s',
                    backgroundColor: 'var(--neutral-50)'
                  }}
                  onFocus={(e) => e.target.style.borderColor = error ? 'var(--error-500)' : 'var(--primary-500)'}
                  onBlur={(e) => e.target.style.borderColor = error ? 'var(--error-500)' : 'var(--neutral-200)'}
                />
              </div>
              
              {error && <div style={{ color: 'var(--error-600)', fontSize: '13px', textAlign: 'left', paddingLeft: '4px', marginTop: '-8px' }}>{error}</div>}
              
              <button type="submit" style={{ 
                width: '100%', 
                padding: '16px', 
                background: 'var(--primary-600)', 
                color: '#fff', 
                border: 'none', 
                borderRadius: '12px', 
                fontSize: '16px', 
                fontWeight: 600, 
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                transition: 'all 0.2s',
                marginTop: '8px'
              }}>
                Bắt đầu làm việc <ArrowRight size={18} />
              </button>
            </form>
            <div style={{ marginTop: '24px', fontSize: '13px', color: 'var(--neutral-400)' }}>
              Thông tin này chỉ lưu trên trình duyệt của bạn.
            </div>
          </div>
        </div>
      )}
    </AuthContext.Provider>
  );
}
