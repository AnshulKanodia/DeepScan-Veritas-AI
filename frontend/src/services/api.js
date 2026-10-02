const API_BASE_URL =
  import.meta.env.VITE_API_URL !== undefined
    ? import.meta.env.VITE_API_URL
    : (import.meta.env.DEV ? 'http://localhost:7860' : '');

export async function checkBackendHealth() {
  try {
    const res = await fetch(`${API_BASE_URL}/health`);
    if (!res.ok) throw new Error('Health check failed');
    return await res.json();
  } catch (err) {
    return { status: 'offline', error: err.message };
  }
}

export async function analyzeText(text) {
  const response = await fetch(`${API_BASE_URL}/api/v1/analyze/text`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text, language: 'en' }),
  });
  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.detail || 'Analysis request failed');
  }
  return await response.json();
}

export async function analyzeCode(code, language = 'python') {
  const response = await fetch(`${API_BASE_URL}/api/v1/analyze/code`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ code, language }),
  });
  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.detail || 'Code analysis request failed');
  }
  return await response.json();
}

export async function getScanHistory() {
  try {
    const response = await fetch(`${API_BASE_URL}/api/v1/history`);
    if (!response.ok) throw new Error('Failed to fetch scan history');
    return await response.json();
  } catch (err) {
    console.error('History fetch error:', err);
    return [];
  }
}

export async function downloadForensicPdf(reportPayload) {
  const response = await fetch(`${API_BASE_URL}/api/v1/export/pdf`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(reportPayload),
  });
  if (!response.ok) throw new Error('Failed to generate forensic PDF');

  const blob = await response.blob();
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `forensic_audit_${reportPayload.forensic_hash?.slice(0, 8) || 'report'}.pdf`;
  document.body.appendChild(a);
  a.click();
  window.URL.revokeObjectURL(url);
  document.body.removeChild(a);
}
