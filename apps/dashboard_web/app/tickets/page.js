'use client';

import { useEffect, useMemo, useState } from 'react';
import { apiFetch, getToken } from '../../lib/api';

const columns = ['PENDING_APPROVAL', 'APPROVED', 'QUEUED', 'RUNNING', 'DONE', 'FAILED'];

export default function TicketsPage() {
  const [token, setToken] = useState('');
  const [tickets, setTickets] = useState([]);
  const [error, setError] = useState('');

  const isAdmin = token && token === (process.env.NEXT_PUBLIC_ADMIN_TOKEN || 'admin-dev-token');

  async function loadTickets() {
    try {
      setError('');
      const data = await apiFetch('/tickets');
      setTickets(data);
    } catch (e) {
      setError(String(e.message));
    }
  }

  async function action(id, act) {
    await apiFetch(`/tickets/${id}/${act}`, { method: 'POST', body: JSON.stringify({}) });
    await loadTickets();
  }

  useEffect(() => {
    const t = getToken();
    setToken(t);
    if (t) loadTickets();
  }, []);

  const grouped = useMemo(() => {
    const g = Object.fromEntries(columns.map((c) => [c, []]));
    tickets.forEach((t) => g[t.status]?.push(t));
    return g;
  }, [tickets]);

  return (
    <div>
      <h2>Tickets Board</h2>
      <input placeholder="paste dev token" defaultValue={token} onBlur={(e) => { localStorage.setItem('dashboard_token', e.target.value); setToken(e.target.value); }} />
      <button onClick={loadTickets}>Load</button>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, minmax(160px, 1fr))', gap: 8, marginTop: 12 }}>
        {columns.map((col) => (
          <div key={col} style={{ border: '1px solid #ddd', padding: 8 }}>
            <h4>{col}</h4>
            {grouped[col].map((t) => (
              <div key={t.id} style={{ border: '1px solid #eee', marginBottom: 8, padding: 6 }}>
                <div>#{t.id} {t.title}</div>
                <small>{t.type} / {t.priority}</small>
                {isAdmin && (
                  <div style={{ marginTop: 6, display: 'flex', gap: 4 }}>
                    {t.status === 'PENDING_APPROVAL' && <>
                      <button onClick={() => action(t.id, 'approve')}>Approve</button>
                      <button onClick={() => action(t.id, 'reject')}>Reject</button>
                    </>}
                    {t.status === 'APPROVED' && <button onClick={() => action(t.id, 'queue')}>Queue</button>}
                  </div>
                )}
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
