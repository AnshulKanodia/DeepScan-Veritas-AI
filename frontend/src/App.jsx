import React, { useState, useEffect, useRef } from 'react';
import {
  ShieldAlert, FileText, Code2, Download, Play, RefreshCw,
  Sparkles, AlertCircle, Terminal, History, Upload, Globe,
  CheckCircle2, Layers
} from 'lucide-react';
import MonacoHeatmap from './components/MonacoHeatmap';
import ForensicMetrics from './components/ForensicMetrics';
import SentenceTable from './components/SentenceTable';
import ScanHistoryModal from './components/ScanHistoryModal';
import UrlScanModal from './components/UrlScanModal';
import ApiModal from './components/ApiModal';
import {
  analyzeText, analyzeCode, downloadForensicPdf,
  checkBackendHealth, getScanHistory
} from './services/api';

export default function App() {
  const [mode, setMode] = useState('text'); // 'text' | 'code'
  const [codeLanguage, setCodeLanguage] = useState('python'); // 'python' | 'javascript' | 'typescript' | 'java' | 'cpp' | 'go'
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [selectedSegment, setSelectedSegment] = useState(null);
  const [engineStatus, setEngineStatus] = useState('checking'); // 'online' | 'offline' | 'checking'
  const [errorMsg, setErrorMsg] = useState(null);
  const [editorType, setEditorType] = useState('monaco'); // 'monaco' | 'textarea'
  const [uploadNotice, setUploadNotice] = useState(null);
  const [isDragging, setIsDragging] = useState(false);

  // Modals state
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [showUrlModal, setShowUrlModal] = useState(false);
  const [showApiModal, setShowApiModal] = useState(false);
  const [historyList, setHistoryList] = useState([]);
  const fileInputRef = useRef(null);

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

  const processUploadedFile = (file) => {
    if (!file) return;
    const name = file.name || 'document.txt';
    const ext = name.includes('.') ? '.' + name.split('.').pop().toLowerCase() : '';

    const codeExts = {
      '.py': 'python',
      '.js': 'javascript',
      '.jsx': 'javascript',
      '.ts': 'typescript',
      '.tsx': 'typescript',
      '.java': 'java',
      '.cpp': 'cpp',
      '.c': 'cpp',
      '.cs': 'csharp',
      '.go': 'go'
    };

    const isCode = Boolean(codeExts[ext]);
    const detectedLang = codeExts[ext] || 'python';

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target.result;
      if (isCode) {
        setMode('code');
        setCodeLanguage(detectedLang);
      } else {
        setMode('text');
      }
      setContent(text);
      setAnalysisResult(null);
      setSelectedSegment(null);
      setUploadNotice(`Imported "${name}" (${(file.size / 1024).toFixed(1)} KB) - Ready for Analysis`);
      setTimeout(() => setUploadNotice(null), 4500);
    };
    reader.readAsText(file);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processUploadedFile(e.dataTransfer.files[0]);
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
        const data = await analyzeCode(content, codeLanguage);
        setAnalysisResult(data);
        if (data.lines && data.lines.length > 0) {
          setSelectedSegment(data.lines[0]);
        }
      }
    } catch (err) {
      console.error(err);
      setErrorMsg(err.message || 'Analysis failed. Ensure the backend service is reachable.');
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
        title: mode === 'text' ? 'Natural Language Forensic Audit' : `Source Code Forensic Audit (${codeLanguage.toUpperCase()})`,
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
      setErrorMsg('Failed to export PDF report.');
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="app-container">
      {/* Top Application Header */}
      <header className="app-header">
        <div className="brand-group">
          <div className="brand-icon-box">
            <ShieldAlert size={20} color="#06B6D4" />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <h1 className="brand-title">VERITAS AI</h1>
              <span className="brand-badge">Forensic Engine v1.2</span>
            </div>
            <p className="brand-sub">
              Statistical Perplexity, Multi-Language AST & Information Entropy
            </p>
          </div>
        </div>

        {/* Forensic Modality Switcher */}
        <div className="modality-tabs">
          <button
            id="tab-text-mode"
            onClick={() => handleModeChange('text')}
            className={`tab-btn ${mode === 'text' ? 'active' : ''}`}
          >
            <FileText size={14} />
            Natural Language (PPL)
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

        {/* Engine Status & Header Action Controls */}
        <div className="header-actions">
          <div className="status-pill">
            <div className={`status-dot ${engineStatus}`} />
            <span style={{ color: '#CBD5E1' }}>
              {engineStatus === 'online'
                ? 'Backend: Online'
                : engineStatus === 'checking'
                ? 'Checking...'
                : 'Backend: Offline'}
            </span>
          </div>

          <button
            id="btn-view-api"
            onClick={() => setShowApiModal(true)}
            className="btn-secondary"
            title="View Developer API & cURL examples"
          >
            <Code2 size={14} color="#06B6D4" />
            Developer API
          </button>

          <button
            id="btn-view-history"
            onClick={handleOpenHistory}
            className="btn-secondary"
            title="View Previous Forensic Scans"
          >
            <History size={14} color="#06B6D4" />
            Audit Logs
          </button>

          <button
            id="btn-export-pdf"
            onClick={handleExportPdf}
            disabled={!analysisResult || exporting}
            className="btn-secondary"
            title="Download Cryptographic Audit Certificate"
          >
            <Download size={14} color="#06B6D4" />
            {exporting ? 'Generating...' : 'Export Audit PDF'}
          </button>
        </div>
      </header>

      {/* Action Toolbar & Legend */}
      <div className="toolbar-bar">
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
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

          {/* File Upload Button */}
          <button
            id="btn-upload-file"
            onClick={() => fileInputRef.current?.click()}
            className="btn-tool"
            title="Upload .txt, .py, .js, .ts, .java, .cpp, .go, .md"
          >
            <Upload size={13} color="#06B6D4" />
            Upload File
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".txt,.py,.js,.jsx,.ts,.tsx,.json,.md,.cpp,.c,.java,.go,.html,.css"
            style={{ display: 'none' }}
            onChange={(e) => {
              if (e.target.files && e.target.files.length > 0) {
                processUploadedFile(e.target.files[0]);
                e.target.value = '';
              }
            }}
          />

          {/* Web / GitHub URL Scanner */}
          <button
            id="btn-scan-url"
            onClick={() => setShowUrlModal(true)}
            className="btn-tool"
            title="Extract and inspect from Web link or GitHub"
          >
            <Globe size={13} color="#38BDF8" />
            Scan URL
          </button>

          {/* Multi-Language Selector for Code Mode */}
          {mode === 'code' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginLeft: 6 }}>
              <span style={{ fontSize: 11, color: '#64748B', fontWeight: 600 }}>Language:</span>
              <select
                id="select-code-language"
                value={codeLanguage}
                onChange={(e) => {
                  setCodeLanguage(e.target.value);
                  if (analysisResult) setAnalysisResult(null);
                }}
                className="select-lang"
              >
                <option value="python">Python</option>
                <option value="javascript">JavaScript</option>
                <option value="typescript">TypeScript</option>
                <option value="java">Java</option>
                <option value="cpp">C++</option>
                <option value="go">Go</option>
              </select>
            </div>
          )}

          <span style={{ fontSize: '0.8rem', color: '#64748B', fontFamily: 'monospace', marginLeft: 8 }}>
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

      {/* Upload Notification Banner */}
      {uploadNotice && (
        <div style={{
          margin: '0 24px 12px 24px',
          padding: '8px 14px',
          borderRadius: 6,
          backgroundColor: 'rgba(6, 182, 212, 0.12)',
          border: '1px solid rgba(6, 182, 212, 0.3)',
          color: '#38BDF8',
          fontSize: '0.8rem',
          display: 'flex',
          alignItems: 'center',
          gap: 8
        }}>
          <CheckCircle2 size={14} color="#06B6D4" />
          <span>{uploadNotice}</span>
        </div>
      )}

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

          <div
            className="editor-wrapper"
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            style={{
              position: 'relative',
              flex: analysisResult ? '0 0 58%' : '1',
              minHeight: '380px',
              display: 'flex',
              flexDirection: 'column'
            }}
          >
            {isDragging && (
              <div className="drag-drop-overlay">
                <Upload size={38} color="#06B6D4" style={{ marginBottom: 10 }} />
                <span style={{ fontSize: 16, fontWeight: 700, color: '#F8FAFC' }}>
                  Drop file to import into Veritas AI
                </span>
                <span style={{ fontSize: 12, color: '#94A3B8', marginTop: 4 }}>
                  Supports .txt, .py, .js, .ts, .java, .cpp, .go, .md, .json
                </span>
              </div>
            )}

            {editorType === 'monaco' ? (
              <MonacoHeatmap
                value={content}
                onChange={handleContentChange}
                language={mode === 'text' ? 'markdown' : codeLanguage}
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

      {/* URL Scan Modal */}
      <UrlScanModal
        isOpen={showUrlModal}
        onClose={() => setShowUrlModal(false)}
        onUrlExtracted={(data) => {
          setMode('text');
          setContent(data.extracted_text);
          setAnalysisResult(data.analysis);
          if (data.analysis?.sentences && data.analysis.sentences.length > 0) {
            setSelectedSegment(data.analysis.sentences[0]);
          }
          setUploadNotice(`Extracted article "${data.title}" from URL`);
          setTimeout(() => setUploadNotice(null), 4500);
        }}
      />

      {/* Developer API Modal */}
      <ApiModal
        isOpen={showApiModal}
        onClose={() => setShowApiModal(false)}
      />
    </div>
  );
}
