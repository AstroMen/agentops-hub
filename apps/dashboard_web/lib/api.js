const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
const TOKEN_KEY = 'dashboard_token';
const USERNAME_KEY = 'dashboard_username';

function emitAuthChange() {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new Event('auth-change'));
}

export function getToken() {
  if (typeof window === 'undefined') return '';
  return localStorage.getItem(TOKEN_KEY) || '';
}

export function getUsername() {
  if (typeof window === 'undefined') return '';
  return localStorage.getItem(USERNAME_KEY) || '';
}

export function getRole() {
  const username = getUsername();
  if (username === 'admin') return 'admin';
  if (username === 'member') return 'member';

  const token = getToken();
  if (!token) return '';

  const adminToken = process.env.NEXT_PUBLIC_ADMIN_TOKEN || 'admin-dev-token';
  const memberToken = process.env.NEXT_PUBLIC_MEMBER_TOKEN || 'member-dev-token';

  if (token === adminToken) return 'admin';
  if (token === memberToken) return 'member';
  return '';
}

export function setToken(token, username = '') {
  if (typeof window === 'undefined') return;
  localStorage.setItem(TOKEN_KEY, token);
  if (username) {
    localStorage.setItem(USERNAME_KEY, username);
  } else {
    localStorage.removeItem(USERNAME_KEY);
  }
  emitAuthChange();
}

export function clearToken() {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USERNAME_KEY);
  emitAuthChange();
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
    let message = txt;

    try {
      const parsed = JSON.parse(txt);
      message = parsed?.detail || parsed?.message || txt;
    } catch (_) {
      // keep raw text when response is not JSON
    }

    if (res.status === 401 || res.status === 403) {
      message = `Permission denied: ${message || 'You do not have enough permissions.'}`;
    }

    throw new Error(message || `Request failed: ${res.status}`);
  }
  return res.json();
}
