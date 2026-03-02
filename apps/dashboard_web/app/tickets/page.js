'use client';

import { useEffect, useMemo, useState } from 'react';
import { apiFetch, getToken } from '../../lib/api';

const columns = ['PENDING_APPROVAL', 'APPROVED', 'QUEUED', 'RUNNING', 'DONE', 'FAILED'];

const defaultForm = {
  title: '',
  description: '',
  type: 'feature',
  priority: 'P2',
  assigned_agent: 'dashboard-dev',
};

export default function TicketsPage() {
  const [token, setToken] = useState('');
  const [tickets, setTickets] = useState([]);
  const [error, setError] = useState('');
  const [form, setForm] = useState(defaultForm);
  const [formMessage, setFormMessage] = useState('');

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

  async function createTicket(e) {
    e.preventDefault();
    try {
      setFormMessage('');
      await apiFetch('/tickets', { method: 'POST', body: JSON.stringify(form) });
      setForm(defaultForm);
      setFormMessage('Ticket created');
      await loadTickets();
    } catch (err) {
      setFormMessage(`Create failed: ${String(err.message)}`);
    }
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
      <input
        placeholder="paste dev token"
        defaultValue={token}
        onBlur={(e) => {
          localStorage.setItem('dashboard_token', e.target.value);
          setToken(e.target.value);
        }}
      />
      <button onClick={loadTickets}>Load</button>

      <form onSubmit={createTicket} style={{ marginTop: 16, border: '1px solid #ddd', padding: 12 }}>
        <h3>Create ticket</h3>
        <div style={{ display: 'grid', gap: 8, maxWidth: 640 }}>
          <input placeholder="Title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
          <textarea placeholder="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} required />
          <div style={{ display: 'flex', gap: 8 }}>
            <input placeholder="Type" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} />
            <select value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })}>
              <option value="P0">P0</option>
              <option value="P1">P1</option>
              <option value="P2">P2</option>
              <option value="P3">P3</option>
            </select>
            <input
              placeholder="Assigned agent"
              value={form.assigned_agent}
              onChange={(e) => setForm({ ...form, assigned_agent: e.target.value })}
            />
          </div>
          <button type="submit">Create</button>
          {formMessage && <small>{formMessage}</small>}
        </div>
      </form>

      {error && <p style={{ color: 'red' }}>{error}</p>}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, minmax(160px, 1fr))', gap: 8, marginTop: 12 }}>
        {columns.map((col) => (
          <div key={col} style={{ border: '1px solid #ddd', padding: 8 }}>
            <h4>{col}</h4>
            {grouped[col].map((t) => (
              <div key={t.id} style={{ border: '1px solid #eee', marginBottom: 8, padding: 6 }}>
                <div>
                  #{t.id} {t.title}
                </div>
                <small>
                  {t.type} / {t.priority}
                </small>
                {isAdmin && (
                  <div style={{ marginTop: 6, display: 'flex', gap: 4 }}>
                    {t.status === 'PENDING_APPROVAL' && (
                      <>
                        <button onClick={() => action(t.id, 'approve')}>Approve</button>
                        <button onClick={() => action(t.id, 'reject')}>Reject</button>
                      </>
                    )}
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
