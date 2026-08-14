"use client";

import React, { ReactNode, useEffect } from "react";
import { X } from "lucide-react";

interface DrawerProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  width?: string;
}

export default function Drawer({ isOpen, onClose, title, children, width = "400px" }: DrawerProps) {
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

  return (
    <>
      {/* Overlay */}
      <div 
        onClick={onClose}
        style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.4)',
          backdropFilter: 'blur(4px)',
          zIndex: 999,
          opacity: isOpen ? 1 : 0,
          pointerEvents: isOpen ? 'auto' : 'none',
          transition: 'opacity var(--duration-normal) var(--ease-out)'
        }}
      />
      
      {/* Drawer */}
      <div
        style={{
          position: 'fixed', top: 0, right: 0, bottom: 0,
          width: width, maxWidth: '100vw',
          backgroundColor: '#ffffff',
          boxShadow: 'var(--shadow-xl)',
          zIndex: 1000,
          transform: isOpen ? 'translateX(0)' : 'translateX(100%)',
          transition: 'transform var(--duration-normal) var(--ease-out)',
          display: 'flex', flexDirection: 'column'
        }}
      >
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: 'var(--space-4) var(--space-5)',
          borderBottom: '1px solid var(--neutral-200)',
          backgroundColor: '#ffffff'
        }}>
          <h2 style={{ fontSize: 'var(--text-lg)', fontWeight: 600, color: 'var(--neutral-900)', margin: 0 }}>
            {title}
          </h2>
          <button 
            onClick={onClose}
            style={{ 
              background: 'none', border: 'none', cursor: 'pointer', 
              color: 'var(--neutral-400)', padding: '4px', borderRadius: '4px',
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}
            onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'var(--neutral-100)'}
            onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
          >
            <X size={20} />
          </button>
        </div>
        
        <div style={{ flex: 1, overflowY: 'auto', padding: 'var(--space-5)', backgroundColor: 'var(--neutral-25)' }}>
          {children}
        </div>
      </div>
    </>
  );
}
