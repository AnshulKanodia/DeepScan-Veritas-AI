import React, { useState } from 'react';
import { X, Globe, Link, ArrowRight, RefreshCw, AlertCircle } from 'lucide-react';
import { analyzeUrl } from '../services/api';

export default function UrlScanModal({ isOpen, onClose, onUrlExtracted }) {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  if (!isOpen) return null;

  const handleFetchAndScan = async (e) => {
    e.preventDefault();
    if (!url.trim()) return;
    setLoading(true);
    setError(null);

    try {
      const data = await analyzeUrl(url.trim());
      if (onUrlExtracted) {
        onUrlExtracted(data);
      }
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to fetch content from URL. Ensure the site allows public web requests.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal-content"
        style={{ maxWidth: '520px', width: '92%' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              background: 'rgba(59, 130, 246, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#3B82F6'
            }}>
              <Globe size={18} />
            </div>
            <div>
              <h2 style={{ fontSize: '1.05rem', fontWeight: 700, margin: 0, color: '#F8FAFC' }}>
                Scan via Web Link or GitHub
              </h2>
              <p style={{ margin: 0, fontSize: '0.75rem', color: '#64748B' }}>
                Extract and analyze online essays, articles, or raw source code files
              </p>
            </div>
          </div>
          <button onClick={onClose} className="modal-close-btn">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleFetchAndScan} style={{ padding: '16px 20px' }}>
          <div style={{ marginBottom: 14 }}>
            <label style={{ display: 'block', fontSize: '0.78rem', color: '#94A3B8', fontWeight: 600, marginBottom: 6 }}>
              Target Document URL
            </label>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <Link size={16} color="#64748B" style={{ position: 'absolute', left: 12 }} />
              <input
                type="url"
                required
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://example.com/article or raw.githubusercontent.com/..."
                style={{
                  width: '100%',
                  padding: '10px 12px 10px 38px',
                  backgroundColor: '#0F172A',
                  border: '1px solid #1E293B',
                  borderRadius: 8,
                  color: '#F8FAFC',
                  fontSize: '0.82rem',
                  fontFamily: "'JetBrains Mono', monospace",
                  outline: 'none'
                }}
              />
            </div>
          </div>

          {error && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              backgroundColor: 'rgba(239, 68, 68, 0.12)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              borderRadius: 6,
              padding: '8px 12px',
              color: '#FCA5A5',
              fontSize: '0.76rem',
              marginBottom: 14
            }}>
              <AlertCircle size={14} />
              <span>{error}</span>
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: '8px 14px',
                borderRadius: 6,
                backgroundColor: 'transparent',
                border: '1px solid #334155',
                color: '#94A3B8',
                fontSize: '0.8rem',
                cursor: 'pointer'
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !url.trim()}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '8px 18px',
                borderRadius: 6,
                backgroundColor: '#3B82F6',
                border: 'none',
                color: '#FFFFFF',
                fontSize: '0.8rem',
                fontWeight: 600,
                cursor: loading ? 'not-allowed' : 'pointer'
              }}
            >
              {loading ? (
                <>
                  <RefreshCw size={14} className="animate-spin" />
                  Fetching & Extracting...
                </>
              ) : (
                <>
                  Extract & Scan
                  <ArrowRight size={14} />
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
