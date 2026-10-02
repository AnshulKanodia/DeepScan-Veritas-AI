import React from 'react';
import { History, X, Clock, FileText, Code2, ShieldCheck, AlertTriangle } from 'lucide-react';

export default function ScanHistoryModal({ isOpen, onClose, history = [], onSelectHistoryItem }) {
  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100vw',
      height: '100vh',
      backgroundColor: 'rgba(0, 0, 0, 0.75)',
      backdropFilter: 'blur(8px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 100,
    }}>
      <div style={{
        width: '600px',
        maxHeight: '80vh',
        backgroundColor: '#0D121F',
        border: '1px solid #1E293B',
        borderRadius: '16px',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.6)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}>
        {/* Header */}
        <div style={{
          padding: '16px 20px',
          borderBottom: '1px solid #1E293B',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <History size={18} color="#06B6D4" />
            <h3 style={{ fontSize: 15, fontWeight: 700, color: '#FFFFFF' }}>Forensic Audit History</h3>
            <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 9999, backgroundColor: 'rgba(6, 182, 212, 0.1)', color: '#22D3EE' }}>
              Database Logs
            </span>
          </div>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', color: '#94A3B8', cursor: 'pointer', padding: 4 }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Content list */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 10 }}>
          {history.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 0', color: '#64748B', fontSize: 13 }}>
              No audit logs recorded yet. Run a forensic analysis to see logs here.
            </div>
          ) : (
            history.map((item) => {
              const isAi = item.overall_ai_score >= 70;
              const isHuman = item.overall_ai_score <= 35;
              const badgeBg = isAi ? 'rgba(239, 68, 68, 0.15)' : isHuman ? 'rgba(16, 185, 129, 0.15)' : 'rgba(245, 158, 11, 0.15)';
              const badgeColor = isAi ? '#F87171' : isHuman ? '#34D399' : '#FBBF24';
              const badgeBorder = isAi ? 'rgba(239, 68, 68, 0.3)' : isHuman ? 'rgba(16, 185, 129, 0.3)' : 'rgba(245, 158, 11, 0.3)';

              return (
                <div
                  key={item.id}
                  style={{
                    backgroundColor: '#0F172A',
                    border: '1px solid #1E293B',
                    borderRadius: '10px',
                    padding: '12px 14px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 6,
                    cursor: onSelectHistoryItem ? 'pointer' : 'default',
                    transition: 'border-color 0.2s',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.borderColor = '#06B6D4')}
                  onMouseLeave={(e) => (e.currentTarget.style.borderColor = '#1E293B')}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 11, color: '#94A3B8' }}>
                      {item.content_type === 'text' ? <FileText size={13} color="#06B6D4" /> : <Code2 size={13} color="#A855F7" />}
                      <span style={{ textTransform: 'uppercase', fontWeight: 600 }}>{item.content_type} Scan</span>
                      <span>•</span>
                      <Clock size={12} />
                      <span>{item.created_at}</span>
                    </div>
                    <span style={{
                      fontSize: 11,
                      fontWeight: 700,
                      padding: '2px 8px',
                      borderRadius: 4,
                      backgroundColor: badgeBg,
                      color: badgeColor,
                      border: `1px solid ${badgeBorder}`
                    }}>
                      {item.overall_ai_score.toFixed(0)}% AI — {item.verdict}
                    </span>
                  </div>

                  <div style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: '#CBD5E1', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    "{item.content_preview}"
                  </div>

                  <div style={{ fontSize: 10, color: '#64748B', fontFamily: 'var(--font-mono)' }}>
                    SHA-256: {item.forensic_hash}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div style={{
          padding: '12px 20px',
          borderTop: '1px solid #1E293B',
          backgroundColor: '#090D16',
          display: 'flex',
          justifyContent: 'flex-end',
        }}>
          <button
            onClick={onClose}
            style={{
              padding: '6px 16px',
              borderRadius: '8px',
              fontSize: '12px',
              fontWeight: 600,
              backgroundColor: '#1E293B',
              color: '#F1F5F9',
              border: '1px solid #334155',
              cursor: 'pointer',
            }}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
