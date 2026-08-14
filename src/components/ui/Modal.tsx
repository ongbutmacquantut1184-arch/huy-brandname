"use client";

import React, { ReactNode, useEffect } from "react";
import { X } from "lucide-react";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  width?: string;
  footer?: ReactNode;
}

export default function Modal({ isOpen, onClose, title, children, width = "500px", footer }: ModalProps) {
  // Prevent body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div 
        className="modal-content" 
        style={{ width, padding: 0, display: 'flex', flexDirection: 'column', maxHeight: '85vh' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ 
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', 
          padding: 'var(--space-4) var(--space-5)', borderBottom: '1px solid var(--neutral-200)' 
        }}>
          <h2 style={{ fontSize: 'var(--text-lg)', fontWeight: 600, color: 'var(--neutral-900)', margin: 0 }}>
            {title}
          </h2>
          <button 
            onClick={onClose}
            style={{ 
              background: 'none', border: 'none', cursor: 'pointer', 
              color: 'var(--neutral-400)', padding: '4px', borderRadius: '4px' 
            }}
            onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'var(--neutral-100)'}
            onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
          >
            <X size={20} />
          </button>
        </div>
        
        <div style={{ padding: 'var(--space-5)', overflowY: 'auto', flex: 1 }}>
          {children}
        </div>
        
        {footer && (
          <div style={{ 
            padding: 'var(--space-4) var(--space-5)', borderTop: '1px solid var(--neutral-200)',
            display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 'var(--space-3)',
            backgroundColor: 'var(--neutral-50)'
          }}>
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
