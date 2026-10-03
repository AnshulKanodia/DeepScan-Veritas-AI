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
import {
  analyzeText, analyzeCode, downloadForensicPdf,
  checkBackendHealth, getScanHistory, extractFile
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
  const [uploadNotice, setUploadNotice] = useState(null);
  const [isDragging, setIsDragging] = useState(false);

  // Mobile adaptive touch editor state
  const [isMobile, setIsMobile] = useState(() => typeof window !== 'undefined' && window.innerWidth <= 868);
  const [editorMode, setEditorMode] = useState(() => (typeof window !== 'undefined' && window.innerWidth <= 868 ? 'touch' : 'monaco'));

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth <= 868;
      setIsMobile(mobile);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Modals state
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [showUrlModal, setShowUrlModal] = useState(false);
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

    // Handle PDF and Word documents via backend extractor
    if (ext === '.pdf' || ext === '.docx' || ext === '.doc') {
      setUploadNotice(`Extracting text from ${name}...`);
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const base64Data = e.target.result;
          const data = await extractFile(name, null, base64Data);
          if (!data.content || !data.content.trim()) {
            throw new Error('No readable text could be extracted from this document.');
          }
          setMode('text');
          setContent(data.content);
          setAnalysisResult(null);
          setSelectedSegment(null);
          const words = data.content.trim().split(/\s+/).length;
          setUploadNotice(`Extracted "${name}" (${(file.size / 1024).toFixed(1)} KB, ${words} words)`);
          setTimeout(() => setUploadNotice(null), 5000);
        } catch (err) {
          setErrorMsg(err.message || `Failed to extract text from ${name}.`);
          setUploadNotice(null);
        }
      };
      reader.readAsDataURL(file);
      return;
    }

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
      setUploadNotice(`Loaded "${name}" (${(file.size / 1024).toFixed(1)} KB)`);
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
            <ShieldAlert size={22} color="#06B6D4" />
          </div>
          <div className="brand-text-wrap">
            <div className="brand-title-row">
              <h1 className="brand-title">VERITAS AI</h1>
              <span className="brand-badge">Forensic v1.2</span>
            </div>
            <p className="brand-sub">
              Statistical Perplexity & Multi-Language Code Forensics
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
            <FileText size={15} />
            <span>Natural Language</span>
          </button>
          <button
            id="tab-code-mode"
            onClick={() => handleModeChange('code')}
            className={`tab-btn ${mode === 'code' ? 'active' : ''}`}
          >
            <Code2 size={15} />
            <span>Source Code</span>
          </button>
        </div>

        {/* Engine Status & Header Action Controls */}
        <div className="header-actions">
          <div className="status-pill" title={`Forensic Engine: ${engineStatus}`}>
            <div className={`status-dot ${engineStatus}`} />
            <span>
              {engineStatus === 'online'
                ? 'Engine Online'
                : engineStatus === 'checking'
                ? 'Connecting...'
                : 'Offline'}
            </span>
          </div>

          <button
            id="btn-view-history"
            onClick={handleOpenHistory}
            className="btn-secondary"
            title="View Previous Forensic Scans"
          >
            <History size={15} color="#06B6D4" />
            <span>Audit Logs</span>
          </button>

          <button
            id="btn-export-pdf"
            onClick={handleExportPdf}
            disabled={!analysisResult || exporting}
            className="btn-secondary"
            title="Download Cryptographic Audit Certificate (PDF)"
          >
            <Download size={15} color="#06B6D4" />
            <span>{exporting ? 'Generating...' : 'Export Audit PDF'}</span>
          </button>
        </div>
      </header>

      {/* Action Toolbar & Legend */}
      <div className="toolbar-bar">
        <div className="toolbar-left">
          {/* File Upload Button */}
          <button
            id="btn-upload-file"
            onClick={() => fileInputRef.current?.click()}
            className="btn-tool"
            title="Upload .pdf, .docx, .txt, or source code files"
          >
            <Upload size={14} color="#06B6D4" />
            <span>Import Document</span>
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".txt,.pdf,.docx,.doc,.py,.js,.jsx,.ts,.tsx,.json,.md,.cpp,.c,.java,.go,.html,.css"
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
            <Globe size={14} color="#38BDF8" />
            <span>Scan URL</span>
          </button>

          {/* Multi-Language Selector for Code Mode */}
          {mode === 'code' && (
            <div className="lang-picker-group">
              <span className="lang-label">Language:</span>
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

          <button
            id="btn-clear-content"
            onClick={() => {
              setContent('');
              setAnalysisResult(null);
              setSelectedSegment(null);
            }}
            className="clear-btn"
            title="Clear editor text"
          >
            Clear
          </button>

          <div className="counter-pill">
            {mode === 'text'
              ? `${content.trim() ? content.trim().split(/\s+/).length : 0} words`
              : `${content ? content.split('\n').length : 0} lines`}
          </div>
        </div>

        {/* Clean Visual Legend */}
        <div className="legend-group">
          <div className="legend-item" title="High structural perplexity and burstiness typical of humans">
            <span className="legend-box human" />
            <span>Human (&lt;35%)</span>
          </div>
          <div className="legend-item" title="Mixed or AI-assisted content">
            <span className="legend-box mixed" />
            <span>Mixed (35-70%)</span>
          </div>
          <div className="legend-item" title="Low perplexity uniformity characteristic of LLMs">
            <span className="legend-box ai" />
            <span>AI (&gt;70%)</span>
          </div>
        </div>

        {/* Primary CTA Button */}
        <button
          id="btn-run-analysis"
          onClick={handleRunAnalysis}
          disabled={loading || !content.trim()}
          className="btn-primary"
        >
          {loading ? (
            <>
              <RefreshCw size={15} className="animate-spin" />
              <span>Scanning Perplexity...</span>
            </>
          ) : (
            <>
              <Play size={15} fill="currentColor" />
              <span>Analyze Authenticity</span>
            </>
          )}
        </button>
      </div>

      {/* Upload Notification Banner */}
      {uploadNotice && (
        <div className="notification-banner info">
          <CheckCircle2 size={15} color="#06B6D4" />
          <span>{uploadNotice}</span>
        </div>
      )}

      {/* Error notification banner */}
      {errorMsg && (
        <div className="notification-banner error">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <AlertCircle size={16} color="#F87171" />
            <span>{errorMsg}</span>
          </div>
          <button
            onClick={() => setErrorMsg(null)}
            className="dismiss-btn"
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
              <Terminal size={15} color="#06B6D4" />
              <span>{editorMode === 'touch' ? 'Touch Editor (Mobile)' : 'Forensic Heatmap Canvas'}</span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              {isMobile && (
                <div className="editor-mode-toggle">
                  <button
                    id="btn-switch-touch"
                    type="button"
                    onClick={() => setEditorMode('touch')}
                    className={`mode-toggle-btn ${editorMode === 'touch' ? 'active' : ''}`}
                    title="Native mobile touch input with keyboard"
                  >
                    Touch Editor
                  </button>
                  <button
                    id="btn-switch-heatmap"
                    type="button"
                    onClick={() => setEditorMode('monaco')}
                    className={`mode-toggle-btn ${editorMode === 'monaco' ? 'active' : ''}`}
                    title="Monaco heatmap canvas"
                  >
                    Heatmap View
                  </button>
                </div>
              )}

              <span className="section-hint">
                {analysisResult
                  ? 'Click any colored segment to inspect granular metrics'
                  : editorMode === 'touch'
                  ? 'Tap to type or paste text'
                  : 'Type, paste, or drop documents (.pdf, .docx, .txt, code)'}
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
                <Upload size={40} color="#06B6D4" style={{ marginBottom: 12 }} />
                <span style={{ fontSize: 16, fontWeight: 700, color: '#F8FAFC' }}>
                  Drop document to import into Veritas AI
                </span>
                <span style={{ fontSize: 12, color: '#94A3B8', marginTop: 4 }}>
                  Supports PDF, Word (.docx), text, and multi-language code
                </span>
              </div>
            )}

            {editorMode === 'touch' ? (
              <textarea
                id="mobile-touch-input"
                value={content}
                onChange={(e) => handleContentChange(e.target.value)}
                placeholder={
                  mode === 'text'
                    ? 'Tap here to type or paste essay, prose, or article to analyze...'
                    : 'Tap here to type or paste source code to analyze...'
                }
                className="mobile-touch-textarea"
                autoCapitalize="sentences"
                autoCorrect="on"
                spellCheck="true"
              />
            ) : (
              <MonacoHeatmap
                value={content}
                onChange={handleContentChange}
                language={mode === 'text' ? 'markdown' : codeLanguage}
                sentences={analysisResult?.sentences || []}
                lines={analysisResult?.lines || []}
                mode={mode}
                onSelectSegment={(seg) => setSelectedSegment(seg)}
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
    </div>
  );
}
