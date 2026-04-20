/**
 * API client — all calls to the real FastAPI backend.
 * No mock data. Returns real ML predictions.
 */

const BASE = 'http://localhost:8000';

async function apiFetch(path, opts = {}) {
  const res = await fetch(`${BASE}${path}`, {
    signal: AbortSignal.timeout(8000),
    ...opts,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail || 'API error');
  }
  return res.json();
}

export const api = {
  health:      ()       => apiFetch('/health'),
  modelInfo:   ()       => apiFetch('/model-info'),
  formulae:    ()       => apiFetch('/formulae'),
  drivers:     ()       => apiFetch('/drivers'),
  circuits:    ()       => apiFetch('/circuits'),
  constructors:()       => apiFetch('/constructors'),
  meta:        ()       => apiFetch('/meta'),

  predict: (body) => apiFetch('/predict', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  }),

  simulate: (body) => apiFetch('/simulate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  }),
};

export const formatTime = (sec) => {
  if (!sec && sec !== 0) return '--:--.---';
  const m = Math.floor(sec / 60);
  const s = (sec % 60).toFixed(3);
  return `${m}:${String(s).padStart(6, '0')}`;
};
