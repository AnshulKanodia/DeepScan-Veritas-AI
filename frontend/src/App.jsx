import React, { useState, useEffect } from 'react';
import {
  ShieldAlert, FileText, Code2, Download, Play, RefreshCw,
  Sparkles, AlertCircle, Terminal, History
} from 'lucide-react';
import MonacoHeatmap from './components/MonacoHeatmap';
import ForensicMetrics from './components/ForensicMetrics';
import SentenceTable from './components/SentenceTable';
import ScanHistoryModal from './components/ScanHistoryModal';
import {
  analyzeText, analyzeCode, downloadForensicPdf,
  checkBackendHealth, getScanHistory
} from './services/api';
export default function App() {
  const [mode, setMode] = useState('text'); // 'text' | 'code'
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [selectedSegment, setSelectedSegment] = useState(null);
  const [engineStatus, setEngineStatus] = useState('checking'); // 'online' | 'offline' | 'checking'
  const [errorMsg, setErrorMsg] = useState(null);
  const [editorType, setEditorType] = useState('monaco'); // 'monaco' | 'textarea'
  
  // Audit History state
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [historyList, setHistoryList] = useState([]);

  // Poll backend health once on mount
  useEffect(() => {
    checkBackendHealth().then((res) => {
      setEngineStatus(res.status === 'healthy' ? 'online' : 'offline');
    });
  }, []);

  const handleModeChange = (newMode) => {
    setMode(newMode);
    setAnalysisResult(null);
    setSelectedSegment(null);
    setErrorMsg(null);
    setContent('');
  };

  const handleContentChange = (newVal) => {
    setContent(newVal || '');
    // Immediately clear previous analysis and highlight decorations when user modifies content
    if (analysisResult) {
      setAnalysisResult(null);
      setSelectedSegment(null);
    }
  };

  const handleRunAnalysis = async () => {
    if (!content.trim()) return;
    setLoading(true);
    setErrorMsg(null);
    setSelectedSegment(null);

    try {
      if (mode === 'text') {
        const data = await analyzeText(content);
        setAnalysisResult(data);
        if (data.sentences && data.sentences.length > 0) {
          setSelectedSegment(data.sentences[0]);
        }
      } else {
        const data = await analyzeCode(content, 'python');
        setAnalysisResult(data);
        if (data.lines && data.lines.length > 0) {
          setSelectedSegment(data.lines[0]);
        }
      }
    } catch (err) {
      console.error(err);
      setErrorMsg(err.message || 'Analysis failed. Ensure the FastAPI backend is running on port 7860.');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenHistory = async () => {
    const list = await getScanHistory();
    setHistoryList(list);
    setShowHistoryModal(true);
  };

  const handleExportPdf = async () => {
    if (!analysisResult) return;
    setExporting(true);
    try {
      const payload = {
        title: mode === 'text' ? 'Natural Language Forensic Audit' : 'Source Code Forensic Audit',
        content_type: mode,
        content: content,
        overall_ai_score: analysisResult.metrics.overall_ai_score,
        verdict: analysisResult.metrics.verdict,
        mean_perplexity: analysisResult.metrics.mean_perplexity,
        burstiness_score: analysisResult.metrics.burstiness_score,
        ast_max_depth: analysisResult.metrics.ast_max_depth,
        identifier_entropy: analysisResult.metrics.identifier_entropy,
        forensic_hash: analysisResult.metrics.forensic_hash,
      };
      await downloadForensicPdf(payload);
    } catch (err) {
      console.error(err);
      setErrorMsg('Failed to download PDF audit report.');
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="app-container">
      {/* Top Navigation Bar */}
      <header className="app-header">
        <div className="brand-section">
          <div className="brand-icon">
            <ShieldAlert size={22} color="#FFFFFF" />
          </div>
          <div>
            <div className="brand-title-wrap">
              <h1 className="brand-title">VERITAS AI</h1>
              <span className="brand-badge">DeepScan Forensic</span>
            </div>
            <div className="brand-subtitle">AI-Generated Text & Source Code Detector</div>
          </div>
        </div>

        {/* Mode Switcher Tabs */}
        <div className="tabs-container">
          <button
            id="tab-text-mode"
            onClick={() => handleModeChange('text')}
            className={`tab-btn ${mode === 'text' ? 'active' : ''}`}
          >
            <FileText size={14} />
            Natural Language
          </button>
          <button
            id="tab-code-mode"
            onClick={() => handleModeChange('code')}
            className={`tab-btn ${mode === 'code' ? 'active' : ''}`}
          >
            <Code2 size={14} />
            Source Code (AST)
          </button>
        </div>

        {/* Engine Status & Actions */}
        <div className="header-actions">
          <div className="status-pill">
            <div className={`status-dot ${engineStatus}`} />
            <span style={{ color: '#CBD5E1' }}>
              {engineStatus === 'online'
                ? 'Backend: Online (7860)'
                : engineStatus === 'checking'
                ? 'Checking...'
                : 'Backend: Offline'}
            </span>
          </div>

          <button
            id="btn-view-history"
            onClick={handleOpenHistory}
            className="btn-secondary"
          >
            <History size={14} color="#06B6D4" />
            Audit Logs
          </button>

          <button
            id="btn-export-pdf"
            onClick={handleExportPdf}
            disabled={!analysisResult || exporting}
            className="btn-secondary"
          >
            <Download size={14} color="#06B6D4" />
            {exporting ? 'Generating...' : 'Export Audit PDF'}
          </button>
        </div>
      </header>

      {/* Action Toolbar & Legend */}
      <div className="toolbar-bar">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button
            id="btn-clear-content"
            onClick={() => {
              setContent('');
              setAnalysisResult(null);
              setSelectedSegment(null);
            }}
            className="clear-btn"
          >
            Clear Editor
          </button>
          <span style={{ fontSize: '0.8rem', color: '#64748B', fontFamily: 'monospace' }}>
            {mode === 'text'
              ? `${content.trim() ? content.trim().split(/\s+/).length : 0} words`
              : `${content ? content.split('\n').length : 0} lines`}
          </span>
        </div>

        {/* Legend */}
        <div className="legend-group">
          <div className="legend-item">
            <span className="legend-box human" />
            <span>Likely Human (Green)</span>
          </div>
          <div className="legend-item">
            <span className="legend-box mixed" />
            <span>Mixed / Refined (Amber)</span>
          </div>
          <div className="legend-item">
            <span className="legend-box ai" />
            <span>Likely AI (Red)</span>
          </div>
        </div>

        {/* Run Analysis Button */}
        <button
          id="btn-run-analysis"
          onClick={handleRunAnalysis}
          disabled={loading || !content.trim()}
          className="btn-primary"
        >
          {loading ? (
            <>
              <RefreshCw size={14} className="animate-spin" />
              Scanning Perplexity...
            </>
          ) : (
            <>
              <Play size={14} fill="#020617" />
              Analyze Authenticity
            </>
          )}
        </button>
      </div>

      {/* Error notification banner */}
      {errorMsg && (
        <div className="error-banner">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <AlertCircle size={16} color="#F87171" />
            <span>{errorMsg}</span>
          </div>
          <button
            onClick={() => setErrorMsg(null)}
            style={{ background: 'none', border: 'none', color: '#FCA5A5', cursor: 'pointer' }}
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Main Workspace: Split Editor & Forensic Dashboard */}
      <main className="workspace-main">
        {/* Left Side: Monaco Editor Visual Heatmap + Sentence Breakdown Table */}
        <section className="editor-section">
          <div className="section-header-row">
            <div className="section-label">
              <Terminal size={14} color="#06B6D4" />
              <span>Interactive Forensic Heatmap Canvas</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ display: 'flex', backgroundColor: '#0F172A', borderRadius: 6, border: '1px solid #1E293B', padding: 2 }}>
                <button
                  id="btn-view-monaco"
                  onClick={() => setEditorType('monaco')}
                  style={{
                    padding: '3px 8px',
                    fontSize: 10,
                    fontWeight: 600,
                    borderRadius: 4,
                    border: 'none',
                    cursor: 'pointer',
                    backgroundColor: editorType === 'monaco' ? '#06B6D4' : 'transparent',
                    color: editorType === 'monaco' ? '#020617' : '#94A3B8'
                  }}
                >
                  Monaco Heatmap
                </button>
                <button
                  id="btn-view-textarea"
                  onClick={() => setEditorType('textarea')}
                  style={{
                    padding: '3px 8px',
                    fontSize: 10,
                    fontWeight: 600,
                    borderRadius: 4,
                    border: 'none',
                    cursor: 'pointer',
                    backgroundColor: editorType === 'textarea' ? '#06B6D4' : 'transparent',
                    color: editorType === 'textarea' ? '#020617' : '#94A3B8'
                  }}
                >
                  Plain Textbox
                </button>
              </div>
              <span className="section-hint">
                Click any colored segment to inspect
              </span>
            </div>
          </div>

          <div className="editor-wrapper" style={{ flex: analysisResult ? '0 0 58%' : '1', minHeight: '380px', display: 'flex', flexDirection: 'column' }}>
            {editorType === 'monaco' ? (
              <MonacoHeatmap
                value={content}
                onChange={handleContentChange}
                language={mode === 'text' ? 'markdown' : 'python'}
                sentences={analysisResult?.sentences || []}
                lines={analysisResult?.lines || []}
                mode={mode}
                onSelectSegment={(seg) => setSelectedSegment(seg)}
              />
            ) : (
              <textarea
                value={content}
                onChange={(e) => handleContentChange(e.target.value)}
                placeholder="Type or paste your text or source code here to analyze..."
                style={{
                  width: '100%',
                  height: '100%',
                  minHeight: '380px',
                  backgroundColor: '#0D1117',
                  color: '#F1F5F9',
                  border: '1px solid #1E293B',
                  borderRadius: 12,
                  padding: 16,
                  fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
                  fontSize: 14,
                  lineHeight: 1.6,
                  resize: 'none',
                  outline: 'none',
                }}
              />
            )}
          </div>

          {/* Sentence-by-Sentence Detailed Table */}
          {analysisResult && (
            <SentenceTable
              sentences={analysisResult.sentences}
              lines={analysisResult.lines}
              mode={mode}
              selectedSegment={selectedSegment}
              onSelectSegment={(seg) => setSelectedSegment(seg)}
            />
          )}
        </section>

        {/* Right Side: Deep Statistical Dashboard */}
        <aside className="dashboard-aside">
          <ForensicMetrics
            metrics={analysisResult?.metrics}
            selectedSegment={selectedSegment}
            mode={mode}
          />
        </aside>
      </main>

      {/* Audit History Modal */}
      <ScanHistoryModal
        isOpen={showHistoryModal}
        onClose={() => setShowHistoryModal(false)}
        history={historyList}
      />
    </div>
  );
}
