import React, { useRef, useEffect } from 'react';
import Editor from '@monaco-editor/react';

export default function MonacoHeatmap({
  value,
  onChange,
  language = 'markdown',
  sentences = [],
  lines = [],
  mode = 'text',
  onSelectSegment,
}) {
  const editorRef = useRef(null);
  const monacoRef = useRef(null);
  const decorationsRef = useRef([]);

  const handleEditorDidMount = (editor, monaco) => {
    editorRef.current = editor;
    monacoRef.current = monaco;

    // Listen to cursor position to trigger segment inspector
    editor.onDidChangeCursorPosition((e) => {
      const position = e.position;
      const model = editor.getModel();
      if (!model) return;
      const offset = model.getOffsetAt(position);

      if (mode === 'text' && sentences.length > 0) {
        const found = sentences.find((s) => offset >= s.start_char && offset <= s.end_char);
        if (found && onSelectSegment) {
          onSelectSegment(found);
        }
      } else if (mode === 'code' && lines.length > 0) {
        const found = lines.find((l) => l.line_number === position.lineNumber);
        if (found && onSelectSegment) {
          onSelectSegment(found);
        }
      }
    });

    applyDecorations();
  };

  const applyDecorations = () => {
    if (!editorRef.current || !monacoRef.current) return;
    const editor = editorRef.current;
    const monaco = monacoRef.current;
    const model = editor.getModel();
    if (!model) return;

    const newDecorations = [];

    if (mode === 'text' && sentences.length > 0) {
      sentences.forEach((s) => {
        const startPos = model.getPositionAt(s.start_char);
        const endPos = model.getPositionAt(s.end_char);

        const className =
          s.classification === 'likely_ai'
            ? 'monaco-ai-highlight'
            : s.classification === 'likely_human'
            ? 'monaco-human-highlight'
            : 'monaco-mixed-highlight';

        newDecorations.push({
          range: new monaco.Range(
            startPos.lineNumber,
            startPos.column,
            endPos.lineNumber,
            endPos.column
          ),
          options: {
            isWholeLine: false,
            inlineClassName: className,
            hoverMessage: {
              value: `**Forensic Verdict:** ${s.classification.replace('_', ' ').toUpperCase()}\n\n• **P(AI):** ${s.ai_probability}%\n• **Perplexity:** ${s.perplexity}`,
            },
          },
        });
      });
    } else if (mode === 'code' && lines.length > 0) {
      lines.forEach((l) => {
        const className =
          l.classification === 'likely_ai'
            ? 'monaco-ai-highlight'
            : l.classification === 'likely_human'
            ? 'monaco-human-highlight'
            : 'monaco-mixed-highlight';

        newDecorations.push({
          range: new monaco.Range(l.line_number, 1, l.line_number, 1),
          options: {
            isWholeLine: true,
            className: className,
            hoverMessage: {
              value: `**Line AI Confidence:** ${l.ai_probability}%\nVerdict: ${l.classification.replace('_', ' ').toUpperCase()}`,
            },
          },
        });
      });
    }

    decorationsRef.current = editor.deltaDecorations(decorationsRef.current, newDecorations);
  };

  useEffect(() => {
    applyDecorations();
  }, [sentences, lines, mode]);

  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        minHeight: '400px',
        borderRadius: '12px',
        overflow: 'hidden',
        border: '1px solid #1E293B',
        backgroundColor: '#0d1117',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {!value && (
        <div
          style={{
            position: 'absolute',
            top: 17,
            left: 56,
            color: '#475569',
            fontSize: 13,
            fontFamily: "'JetBrains Mono', 'Fira Code', Menlo, monospace",
            pointerEvents: 'none',
            userSelect: 'none',
            zIndex: 1,
            fontStyle: 'italic',
          }}
        >
          {mode === 'text'
            ? 'Paste or type essay, prose, or article here to analyze linguistic authenticity...'
            : 'Paste or type Python code here to analyze AST & identifier entropy...'}
        </div>
      )}
      <Editor
        height="100%"
        width="100%"
        language={language}
        value={value}
        onChange={onChange}
        theme="vs-dark"
        onMount={handleEditorDidMount}
        loading={
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', minHeight: '350px', color: '#64748B', fontSize: 13, gap: 8 }}>
            <span>Loading Forensic Monaco Canvas...</span>
          </div>
        }
        options={{
          minimap: { enabled: false },
          fontSize: 14,
          fontFamily: "'JetBrains Mono', 'Fira Code', Menlo, monospace",
          lineNumbers: 'on',
          scrollBeyondLastLine: false,
          automaticLayout: true,
          wordWrap: 'on',
          padding: { top: 16, bottom: 16 },
          renderLineHighlight: 'all',
          cursorBlinking: 'smooth',
          cursorSmoothCaretAnimation: 'on',
          smoothScrolling: true,
          overviewRulerBorder: false,
        }}
      />
    </div>
  );
}
