import React from 'react';
import { AlignLeft, ArrowUpDown } from 'lucide-react';

export default function SentenceTable({ sentences = [], lines = [], mode = 'text', onSelectSegment, selectedSegment }) {
  const items = mode === 'text' ? sentences : lines;

  if (!items || items.length === 0) return null;

  return (
    <div style={{
      marginTop: 14,
      borderRadius: 12,
      border: '1px solid #1E293B',
      backgroundColor: 'rgba(15, 23, 42, 0.7)',
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column',
    }}>
      <div style={{
        padding: '10px 16px',
        backgroundColor: '#0F172A',
        borderBottom: '1px solid #1E293B',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: '#94A3B8' }}>
          <AlignLeft size={14} color="#06B6D4" />
          <span>{mode === 'text' ? 'Sentence-by-Sentence Breakdown' : 'Line-by-Line AST Breakdown'}</span>
        </div>
        <span style={{ fontSize: 11, color: '#64748B' }}>
          {items.length} segments analyzed
        </span>
      </div>

      <div style={{ maxHeight: '190px', overflowY: 'auto', overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
        <table style={{ width: '100%', minWidth: '440px', borderCollapse: 'collapse', fontSize: 11 }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #1E293B', color: '#64748B', textAlign: 'left' }}>
              <th style={{ padding: '8px 12px', width: '40px' }}>#</th>
              <th style={{ padding: '8px 12px' }}>Segment Content</th>
              {mode === 'text' && <th style={{ padding: '8px 12px', width: '90px' }}>Perplexity</th>}
              <th style={{ padding: '8px 12px', width: '90px' }}>AI Prob.</th>
              <th style={{ padding: '8px 12px', width: '110px' }}>Verdict</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, idx) => {
              const isSelected = selectedSegment && (
                mode === 'text' ? selectedSegment.index === item.index : selectedSegment.line_number === item.line_number
              );
              const textContent = mode === 'text' ? item.text : item.code;
              const isAi = item.classification === 'likely_ai';
              const isHuman = item.classification === 'likely_human';
              const badgeBg = isAi ? 'rgba(239, 68, 68, 0.2)' : isHuman ? 'rgba(16, 185, 129, 0.2)' : 'rgba(245, 158, 11, 0.2)';
              const badgeColor = isAi ? '#F87171' : isHuman ? '#34D399' : '#FBBF24';

              return (
                <tr
                  key={idx}
                  onClick={() => onSelectSegment && onSelectSegment(item)}
                  style={{
                    borderBottom: '1px solid rgba(30, 41, 59, 0.5)',
                    backgroundColor: isSelected ? 'rgba(6, 182, 212, 0.12)' : 'transparent',
                    cursor: 'pointer',
                    transition: 'background-color 0.15s ease',
                  }}
                  onMouseEnter={(e) => {
                    if (!isSelected) e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.03)';
                  }}
                  onMouseLeave={(e) => {
                    if (!isSelected) e.currentTarget.style.backgroundColor = 'transparent';
                  }}
                >
                  <td style={{ padding: '6px 12px', color: '#64748B', fontFamily: 'var(--font-mono)' }}>
                    {mode === 'text' ? item.index + 1 : item.line_number}
                  </td>
                  <td style={{ padding: '6px 12px', color: '#CBD5E1', maxWidth: '300px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {textContent}
                  </td>
                  {mode === 'text' && (
                    <td style={{ padding: '6px 12px', fontFamily: 'var(--font-mono)', color: item.perplexity < 25 ? '#F87171' : '#34D399' }}>
                      {item.perplexity}
                    </td>
                  )}
                  <td style={{ padding: '6px 12px', fontFamily: 'var(--font-mono)', fontWeight: 600, color: badgeColor }}>
                    {item.ai_probability}%
                  </td>
                  <td style={{ padding: '6px 12px' }}>
                    <span style={{
                      padding: '2px 6px',
                      borderRadius: 4,
                      fontSize: 10,
                      fontWeight: 600,
                      backgroundColor: badgeBg,
                      color: badgeColor,
                    }}>
                      {item.classification.replace('_', ' ').toUpperCase()}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
