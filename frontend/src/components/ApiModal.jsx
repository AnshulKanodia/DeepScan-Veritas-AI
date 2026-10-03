import React, { useState } from 'react';
import { X, Copy, Check, Terminal, Code, Cpu } from 'lucide-react';

export default function ApiModal({ isOpen, onClose }) {
  const [activeTab, setActiveTab] = useState('curl');
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const currentHost = typeof window !== 'undefined' ? window.location.origin : 'https://deepscan-veritas-ai.vercel.app';

  const snippets = {
    curl: `curl -X POST "${currentHost}/api/v1/analyze/text" \\
  -H "Content-Type: application/json" \\
  -d '{
    "text": "Furthermore, it is crucial to observe that neural models exhibit predictable distributions."
  }'`,
    python: `import requests

url = "${currentHost}/api/v1/analyze/text"
payload = {
    "text": "Furthermore, it is crucial to observe that neural models exhibit predictable distributions."
}

response = requests.post(url, json=payload)
data = response.json()

print(f"Verdict: {data['metrics']['verdict']}")
print(f"Overall AI Score: {data['metrics']['overall_ai_score']}%")
print(f"Mean Perplexity: {data['metrics']['mean_perplexity']}")`,
    javascript: `const response = await fetch("${currentHost}/api/v1/analyze/text", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    text: "Furthermore, it is crucial to observe that neural models exhibit predictable distributions."
  })
});

const data = await response.json();
console.log("Verdict:", data.metrics.verdict);
console.log("AI Probability:", data.metrics.overall_ai_score);`
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(snippets[activeTab]);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal-content"
        style={{ maxWidth: '640px', width: '92%' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              background: 'rgba(6, 182, 212, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#06B6D4'
            }}>
              <Terminal size={18} />
            </div>
            <div>
              <h2 style={{ fontSize: '1.05rem', fontWeight: 700, margin: 0, color: '#F8FAFC' }}>
                Veritas AI Developer API
              </h2>
              <p style={{ margin: 0, fontSize: '0.75rem', color: '#64748B' }}>
                Integrate real-time linguistic forensics into your application or CI pipeline
              </p>
            </div>
          </div>
          <button onClick={onClose} className="modal-close-btn">
            <X size={18} />
          </button>
        </div>

        <div style={{ padding: '16px 20px' }}>
          <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
            {['curl', 'python', 'javascript'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                style={{
                  padding: '6px 14px',
                  borderRadius: 6,
                  border: '1px solid',
                  borderColor: activeTab === tab ? '#06B6D4' : '#1E293B',
                  background: activeTab === tab ? 'rgba(6, 182, 212, 0.12)' : '#0F172A',
                  color: activeTab === tab ? '#06B6D4' : '#94A3B8',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px'
                }}
              >
                {tab === 'curl' ? 'cURL' : tab === 'python' ? 'Python' : 'JavaScript'}
              </button>
            ))}
          </div>

          <div style={{ position: 'relative' }}>
            <pre
              style={{
                backgroundColor: '#050811',
                border: '1px solid #1E293B',
                borderRadius: 8,
                padding: '14px 16px',
                fontSize: '0.82rem',
                fontFamily: "'JetBrains Mono', monospace",
                color: '#38BDF8',
                overflowX: 'auto',
                lineHeight: 1.6,
                margin: 0
              }}
            >
              {snippets[activeTab]}
            </pre>
            <button
              onClick={handleCopy}
              style={{
                position: 'absolute',
                top: 10,
                right: 10,
                padding: '5px 10px',
                borderRadius: 6,
                backgroundColor: 'rgba(30, 41, 59, 0.9)',
                border: '1px solid #334155',
                color: copied ? '#10B981' : '#E2E8F0',
                fontSize: '0.75rem',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                cursor: 'pointer'
              }}
            >
              {copied ? <Check size={14} /> : <Copy size={14} />}
              {copied ? 'Copied!' : 'Copy'}
            </button>
          </div>

          <div style={{ marginTop: 16, padding: '12px 14px', borderRadius: 8, backgroundColor: 'rgba(15, 23, 42, 0.6)', border: '1px solid #1E293B' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#F1F5F9', fontSize: '0.8rem', fontWeight: 600, marginBottom: 4 }}>
              <Cpu size={14} color="#06B6D4" />
              <span>Public Rate Limits & Authentication:</span>
            </div>
            <p style={{ margin: 0, fontSize: '0.74rem', color: '#94A3B8', lineHeight: 1.5 }}>
              The endpoint is open and requires zero API keys. Supports payload sizes up to 20,000 words with in-memory execution under 300ms.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
