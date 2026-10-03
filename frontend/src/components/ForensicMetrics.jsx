import React from 'react';
import { ShieldCheck, AlertTriangle, Cpu, Activity, BarChart2, Hash, Layers, Code2 } from 'lucide-react';

export default function ForensicMetrics({ metrics, selectedSegment, mode }) {
  if (!metrics) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100%',
        textAlign: 'center',
        color: '#64748B',
        border: '1px dashed rgba(255, 255, 255, 0.1)',
        borderRadius: '14px',
        padding: '36px 24px',
        backgroundColor: 'rgba(15, 23, 42, 0.3)'
      }}>
        <div style={{
          width: 52,
          height: 52,
          borderRadius: 14,
          backgroundColor: 'rgba(6, 182, 212, 0.1)',
          border: '1px solid rgba(6, 182, 212, 0.25)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: 16
        }}>
          <Activity size={24} color="#06B6D4" />
        </div>
        <p style={{ fontSize: 14, fontWeight: 700, color: '#F1F5F9' }}>Awaiting Forensic Analysis</p>
        <p style={{ fontSize: 12, color: '#94A3B8', marginTop: 6, maxWidth: 280, lineHeight: 1.5 }}>
          Import or paste content to compute statistical perplexity, AST depth, and structural entropy.
        </p>
        <div style={{
          marginTop: 20,
          display: 'flex',
          flexDirection: 'column',
          gap: 8,
          width: '100%',
          maxWidth: 260,
          fontSize: 11,
          color: '#64748B',
          textAlign: 'left'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: '#06B6D4' }} />
            <span>N-gram Perplexity ($PPL$) & Burstiness</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: '#10B981' }} />
            <span>Abstract Syntax Tree (AST) Parsing</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: '#F59E0B' }} />
            <span>QuillBot & StealthGPT Bypass Detection</span>
          </div>
        </div>
      </div>
    );
  }

  const score = metrics.overall_ai_score;
  const isAi = score >= 70;
  const isHuman = score <= 35;
  const classificationKey = isAi ? 'ai' : isHuman ? 'human' : 'mixed';
  const scoreRingColor = isAi ? '#EF4444' : isHuman ? '#10B981' : '#F59E0B';

  const radius = 38;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflowY: 'auto' }}>
      {/* Primary Verdict Card */}
      <div className={`verdict-box ${classificationKey}`}>
        <div>
          <div className="verdict-heading">Forensic Verdict</div>
          <div className={`verdict-title ${classificationKey}`}>{metrics.verdict}</div>
          <div className="verdict-desc">
            {isAi
              ? 'Low perplexity & structural uniformity indicating LLM generation.'
              : isHuman
              ? 'High structural variance & burstiness typical of human author.'
              : 'Mixed characteristics or synthetic editing detected.'}
          </div>
        </div>

        {/* Circular SVG Gauge */}
        <div style={{ position: 'relative', width: 90, height: 90, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <svg style={{ width: 90, height: 90, transform: 'rotate(-90deg)' }}>
            <circle cx="45" cy="45" r={radius} stroke="#1E293B" strokeWidth="8" fill="none" />
            <circle
              cx="45"
              cy="45"
              r={radius}
              stroke={scoreRingColor}
              strokeWidth="8"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              fill="none"
              style={{ transition: 'stroke-dashoffset 0.8s ease' }}
            />
          </svg>
          <div style={{ position: 'absolute', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <span style={{ fontSize: 18, fontWeight: 900, color: scoreRingColor }}>{score.toFixed(0)}%</span>
            <span style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', color: '#64748B' }}>AI Conf.</span>
          </div>
        </div>
      </div>

      {/* Forensic Metric Grid */}
      <div className="metrics-grid">
        {mode === 'text' ? (
          <>
            <div className="metric-card">
              <div className="metric-card-header">
                <Activity size={14} color="#06B6D4" />
                <span>Mean PPL</span>
              </div>
              <div className="metric-value">{metrics.mean_perplexity}</div>
              <div className="metric-sub">Lower = Predictable</div>
            </div>

            <div className="metric-card">
              <div className="metric-card-header">
                <BarChart2 size={14} color="#10B981" />
                <span>Burstiness</span>
              </div>
              <div className="metric-value">{metrics.burstiness_score}</div>
              <div className="metric-sub">Fano factor (Var/Mean)</div>
            </div>

            <div className="metric-card">
              <div className="metric-card-header">
                <Cpu size={14} color="#A855F7" />
                <span>Top-10 Ratio</span>
              </div>
              <div className="metric-value">{metrics.top10_token_ratio}%</div>
              <div className="metric-sub">Top ranked tokens</div>
            </div>

            <div className="metric-card">
              <div className="metric-card-header">
                <Layers size={14} color="#3B82F6" />
                <span>Min PPL</span>
              </div>
              <div className="metric-value">{metrics.min_perplexity}</div>
              <div className="metric-sub">Lowest sentence surprise</div>
            </div>

            {/* AI Humanizer / Paraphrase Bypass Detector */}
            <div className="metric-card" style={{
              gridColumn: 'span 2',
              borderColor: (metrics.humanizer_score || 0) >= 60 ? 'rgba(239, 68, 68, 0.4)' : (metrics.humanizer_score || 0) >= 35 ? 'rgba(245, 158, 11, 0.4)' : '#1E293B',
              backgroundColor: (metrics.humanizer_score || 0) >= 60 ? 'rgba(239, 68, 68, 0.08)' : '#0F172A'
            }}>
              <div className="metric-card-header" style={{ justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <ShieldCheck size={14} color={(metrics.humanizer_score || 0) >= 60 ? '#EF4444' : '#10B981'} />
                  <span>AI Humanizer / Paraphrase Risk</span>
                </div>
                <span style={{
                  fontSize: 10,
                  fontWeight: 700,
                  padding: '2px 6px',
                  borderRadius: 4,
                  backgroundColor: (metrics.humanizer_score || 0) >= 60 ? 'rgba(239, 68, 68, 0.2)' : (metrics.humanizer_score || 0) >= 35 ? 'rgba(245, 158, 11, 0.2)' : 'rgba(16, 185, 129, 0.2)',
                  color: (metrics.humanizer_score || 0) >= 60 ? '#F87171' : (metrics.humanizer_score || 0) >= 35 ? '#FBBF24' : '#34D399'
                }}>
                  {metrics.humanizer_verdict || 'None Detected'}
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginTop: 4 }}>
                <span className="metric-value" style={{
                  color: (metrics.humanizer_score || 0) >= 60 ? '#EF4444' : (metrics.humanizer_score || 0) >= 35 ? '#F59E0B' : '#10B981'
                }}>
                  {metrics.humanizer_score ?? 0}%
                </span>
                <span className="metric-sub" style={{ margin: 0 }}>
                  QuillBot / StealthGPT substitution entropy
                </span>
              </div>
            </div>
          </>
        ) : (
          <>
            <div className="metric-card">
              <div className="metric-card-header">
                <Layers size={14} color="#06B6D4" />
                <span>AST Depth</span>
              </div>
              <div className="metric-value">{metrics.ast_max_depth}</div>
              <div className="metric-sub">Syntax tree nesting</div>
            </div>

            <div className="metric-card">
              <div className="metric-card-header">
                <Activity size={14} color="#10B981" />
                <span>Entropy</span>
              </div>
              <div className="metric-value">{metrics.identifier_entropy} <span style={{ fontSize: 11, color: '#94A3B8' }}>bits</span></div>
              <div className="metric-sub">Identifier randomness</div>
            </div>

            <div className="metric-card">
              <div className="metric-card-header">
                <Code2 size={14} color="#A855F7" />
                <span>Branches</span>
              </div>
              <div className="metric-value">{metrics.cyclomatic_complexity}</div>
              <div className="metric-sub">Cyclomatic complexity</div>
            </div>

            <div className="metric-card">
              <div className="metric-card-header">
                <BarChart2 size={14} color="#F59E0B" />
                <span>Comments</span>
              </div>
              <div className="metric-value">{metrics.comment_density_pct}%</div>
              <div className="metric-sub">Comment line density</div>
            </div>
          </>
        )}
      </div>

      {/* Selected Segment Inspector */}
      {selectedSegment && (
        <div className="segment-inspector-box">
          <div className="inspector-header">
            <span className="inspector-title">
              {mode === 'text' ? `Sentence #${selectedSegment.index + 1}` : `Line #${selectedSegment.line_number}`}
            </span>
            <span
              className={`inspector-badge ${
                selectedSegment.classification === 'likely_ai'
                  ? 'ai'
                  : selectedSegment.classification === 'likely_human'
                  ? 'human'
                  : 'mixed'
              }`}
            >
              {selectedSegment.ai_probability}% AI Probability
            </span>
          </div>
          <div className="inspector-text">
            "{mode === 'text' ? selectedSegment.text : selectedSegment.code}"
          </div>
          {mode === 'text' && (
            <div className="inspector-row">
              <span>Sentence Perplexity:</span>
              <strong style={{ color: '#F1F5F9', fontFamily: 'var(--font-mono)' }}>{selectedSegment.perplexity}</strong>
            </div>
          )}
        </div>
      )}

      {/* Cryptographic SHA-256 Stamp */}
      <div className="hash-container">
        <Hash size={16} color="#64748B" style={{ flexShrink: 0 }} />
        <div style={{ overflow: 'hidden' }}>
          <div className="hash-title">Forensic Audit Hash (SHA-256)</div>
          <div className="hash-value">{metrics.forensic_hash}</div>
        </div>
      </div>
    </div>
  );
}
