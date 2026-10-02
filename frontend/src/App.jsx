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
import { SAMPLE_TEXTS, SAMPLE_CODES } from './data/samples';

export default function App() {
  const [mode, setMode] = useState('text'); // 'text' | 'code'
  const [content, setContent] = useState(SAMPLE_TEXTS.aiEssay);
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [selectedSegment, setSelectedSegment] = useState(null);
  const [engineStatus, setEngineStatus] = useState('checking'); // 'online' | 'offline' | 'checking'
  const [errorMsg, setErrorMsg] = useState(null);
  
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
    if (newMode === 'text') {
      setContent(SAMPLE_TEXTS.aiEssay);
    } else {
      setContent(SAMPLE_CODES.aiCode);
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

      {/* Preset Toolbar & Action Bar */}
      <div className="toolbar-bar">
        <div className="presets-group">
          <span style={{ color: '#64748B', display: 'flex', alignItems: 'center', gap: 4, marginRight: 4 }}>
            <Sparkles size={12} color="#06B6D4" /> Sample Presets:
          </span>
          {mode === 'text' ? (
            <>
              <button
                id="btn-sample-ai-text"
                onClick={() => {
                  setContent(SAMPLE_TEXTS.aiEssay);
                  setAnalysisResult(null);
                }}
                className="preset-btn"
              >
                ChatGPT Essay
              </button>
              <button
                id="btn-sample-human-text"
                onClick={() => {
                  setContent(SAMPLE_TEXTS.humanEssay);
                  setAnalysisResult(null);
                }}
                className="preset-btn"
              >
                Human Essay
              </button>
            </>
          ) : (
            <>
              <button
                id="btn-sample-ai-code"
                onClick={() => {
                  setContent(SAMPLE_CODES.aiCode);
                  setAnalysisResult(null);
                }}
                className="preset-btn"
              >
                AI Python Code
              </button>
              <button
                id="btn-sample-human-code"
                onClick={() => {
                  setContent(SAMPLE_CODES.humanCode);
                  setAnalysisResult(null);
                }}
                className="preset-btn"
              >
                Human Python Code
              </button>
            </>
          )}

          <button
            onClick={() => {
              setContent('');
              setAnalysisResult(null);
              setSelectedSegment(null);
            }}
            className="clear-btn"
          >
            Clear
          </button>
        </div>

        {/* Legend */}
        <div className="legend-group">
          <div className="legend-item">
            <span className="legend-box human" />
            <span>Likely Human (PPL &gt; 45)</span>
          </div>
          <div className="legend-item">
            <span className="legend-box mixed" />
            <span>Mixed / Edited</span>
          </div>
          <div className="legend-item">
            <span className="legend-box ai" />
            <span>Likely AI (PPL &lt; 25)</span>
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
            <span className="section-hint">
              Click any colored sentence or line to inspect token surprise
            </span>
          </div>

          <div className="editor-wrapper" style={{ flex: analysisResult ? '0 0 58%' : '1' }}>
            <MonacoHeatmap
              value={content}
              onChange={(val) => setContent(val || '')}
              language={mode === 'text' ? 'markdown' : 'python'}
              sentences={analysisResult?.sentences || []}
              lines={analysisResult?.lines || []}
              mode={mode}
              onSelectSegment={(seg) => setSelectedSegment(seg)}
            />
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
