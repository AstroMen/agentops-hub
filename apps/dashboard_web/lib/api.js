const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export function getToken() {
  if (typeof window === 'undefined') return '';
  return localStorage.getItem('dashboard_token') || '';
}

export async function apiFetch(path, options = {}) {
  const token = getToken();
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: token ? `Bearer ${token}` : '',
      ...(options.headers || {}),
    },
    cache: 'no-store',
  });

  if (!res.ok) {
    const txt = await res.text();
    throw new Error(txt || `Request failed: ${res.status}`);
  }
  return res.json();
}
